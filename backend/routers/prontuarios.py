from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Prontuario, Paciente, Psicologo, Usuario
from schemas import ProntuarioCreate, ProntuarioUpdate, ProntuarioResponse
from utils.auth import get_usuario_atual
from utils.audit import registrar_audit, serializar_modelo
from utils.crypto import criptografar, descriptografar

router = APIRouter(prefix="/prontuarios", tags=["Prontuários"])


def formatar_prontuario_response(pr: Prontuario) -> dict:
    return {
        "id": pr.id,
        "usuario_id": pr.usuario_id,
        "paciente_id": pr.paciente_id,
        "psicologo_id": pr.psicologo_id,
        "data": pr.data,
        "tipo": pr.tipo,
        "evolucao": descriptografar(pr.evolucao),
        "conduta": pr.conduta,
        "confidencial": pr.confidencial,
        "criado_em": pr.criado_em,
        "atualizado_em": pr.atualizado_em,
        "paciente_nome": pr.paciente.nome if pr.paciente else "Paciente removido",
        "psicologo_nome": pr.psicologo.nome if pr.psicologo else "Não atribuído",
    }


@router.get("/", response_model=list[ProntuarioResponse])
def listar_prontuarios(
    paciente_id: int | None = None,
    psicologo_id: int | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if usuario.papel == "secretaria":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso a prontuários restrito a profissionais de psicologia e administração.",
        )

    query = db.query(Prontuario)
    if usuario.papel != "admin":
        query = query.filter(Prontuario.usuario_id == usuario.id)

    if paciente_id:
        query = query.filter(Prontuario.paciente_id == paciente_id)
    if psicologo_id:
        query = query.filter(Prontuario.psicologo_id == psicologo_id)

    itens = query.order_by(Prontuario.data.desc(), Prontuario.id.desc()).all()

    # Auditoria de leitura
    registrar_audit(
        db, usuario.id, "LER_LISTA", "prontuarios",
        dados_novos={"paciente_id": paciente_id, "quantidade": len(itens)}
    )
    return [formatar_prontuario_response(pr) for pr in itens]


@router.post("/", response_model=ProntuarioResponse, status_code=status.HTTP_201_CREATED)
def criar_prontuario(
    dados: ProntuarioCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if usuario.papel == "secretaria":
        raise HTTPException(status_code=403, detail="Secretaria não tem permissão para criar prontuários")

    paciente = db.query(Paciente).filter(Paciente.id == dados.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    dados_dict = dados.model_dump()
    # Criptografa o conteúdo da evolução clínica
    if dados_dict.get("evolucao"):
        dados_dict["evolucao"] = criptografar(dados_dict["evolucao"])

    prontuario = Prontuario(usuario_id=usuario.id, **dados_dict)
    db.add(prontuario)
    db.commit()
    db.refresh(prontuario)

    # Auditoria (registra criação sem expor texto confidencial no log)
    registrar_audit(
        db, usuario.id, "CRIAR", "prontuarios", prontuario.id,
        dados_novos={"paciente_id": dados.paciente_id, "tipo": dados.tipo, "data": str(dados.data)}
    )
    return formatar_prontuario_response(prontuario)


@router.get("/{prontuario_id}", response_model=ProntuarioResponse)
def obter_prontuario(
    prontuario_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if usuario.papel == "secretaria":
        raise HTTPException(status_code=403, detail="Acesso não autorizado")

    query = db.query(Prontuario).filter(Prontuario.id == prontuario_id)
    if usuario.papel != "admin":
        query = query.filter(Prontuario.usuario_id == usuario.id)

    pr = query.first()
    if not pr:
        raise HTTPException(status_code=404, detail="Prontuário não encontrado")

    registrar_audit(db, usuario.id, "LER_REGISTRO", "prontuarios", pr.id)
    return formatar_prontuario_response(pr)


@router.put("/{prontuario_id}", response_model=ProntuarioResponse)
def atualizar_prontuario(
    prontuario_id: int,
    dados: ProntuarioUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if usuario.papel == "secretaria":
        raise HTTPException(status_code=403, detail="Acesso não autorizado")

    query = db.query(Prontuario).filter(Prontuario.id == prontuario_id)
    if usuario.papel != "admin":
        query = query.filter(Prontuario.usuario_id == usuario.id)

    pr = query.first()
    if not pr:
        raise HTTPException(status_code=404, detail="Prontuário não encontrado")

    dados_atualizar = dados.model_dump(exclude_unset=True)
    if "evolucao" in dados_atualizar and dados_atualizar["evolucao"]:
        dados_atualizar["evolucao"] = criptografar(dados_atualizar["evolucao"])

    for campo, valor in dados_atualizar.items():
        setattr(pr, campo, valor)

    db.commit()
    db.refresh(pr)

    registrar_audit(db, usuario.id, "ATUALIZAR", "prontuarios", pr.id, dados_novos={"tipo": pr.tipo, "data": str(pr.data)})
    return formatar_prontuario_response(pr)


@router.delete("/{prontuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_prontuario(
    prontuario_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if usuario.papel != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem excluir registros clínicos")

    pr = db.query(Prontuario).filter(Prontuario.id == prontuario_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Prontuário não encontrado")

    db.delete(pr)
    db.commit()

    registrar_audit(db, usuario.id, "EXCLUIR", "prontuarios", prontuario_id)
    return None
