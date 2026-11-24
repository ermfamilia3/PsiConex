from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import AplicacaoTeste, Paciente, Psicologo, Usuario
from schemas import AplicacaoTesteCreate, AplicacaoTesteUpdate, AplicacaoTesteResponse
from utils.auth import get_usuario_atual
from utils.audit import registrar_audit, serializar_modelo

router = APIRouter(prefix="/testes", tags=["Testes Psicológicos"])


def formatar_teste_response(teste: AplicacaoTeste) -> dict:
    return {
        "id": teste.id,
        "usuario_id": teste.usuario_id,
        "paciente_id": teste.paciente_id,
        "psicologo_id": teste.psicologo_id,
        "instrumento": teste.instrumento,
        "data_aplicacao": teste.data_aplicacao,
        "status": teste.status,
        "resultado": teste.resultado,
        "observacoes": teste.observacoes,
        "criado_em": teste.criado_em,
        "atualizado_em": teste.atualizado_em,
        "paciente_nome": teste.paciente.nome if teste.paciente else "Paciente removido",
        "psicologo_nome": teste.psicologo.nome if teste.psicologo else "Não atribuído",
    }


@router.get("/", response_model=list[AplicacaoTesteResponse])
def listar_testes(
    paciente_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(AplicacaoTeste)
    if usuario.papel != "admin":
        query = query.filter(AplicacaoTeste.usuario_id == usuario.id)

    if paciente_id:
        query = query.filter(AplicacaoTeste.paciente_id == paciente_id)
    if status:
        query = query.filter(AplicacaoTeste.status == status)

    itens = query.order_by(AplicacaoTeste.data_aplicacao.desc()).all()
    return [formatar_teste_response(t) for t in itens]


@router.post("/", response_model=AplicacaoTesteResponse, status_code=status.HTTP_201_CREATED)
def criar_teste(
    dados: AplicacaoTesteCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    paciente = db.query(Paciente).filter(Paciente.id == dados.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    teste = AplicacaoTeste(usuario_id=usuario.id, **dados.model_dump())
    db.add(teste)
    db.commit()
    db.refresh(teste)

    registrar_audit(db, usuario.id, "CRIAR", "aplicacoes_testes", teste.id, dados_novos=dados.model_dump())
    return formatar_teste_response(teste)


@router.get("/{teste_id}", response_model=AplicacaoTesteResponse)
def obter_teste(
    teste_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(AplicacaoTeste).filter(AplicacaoTeste.id == teste_id)
    if usuario.papel != "admin":
        query = query.filter(AplicacaoTeste.usuario_id == usuario.id)
    teste = query.first()
    if not teste:
        raise HTTPException(status_code=404, detail="Registro de teste não encontrado")
    return formatar_teste_response(teste)


@router.put("/{teste_id}", response_model=AplicacaoTesteResponse)
def atualizar_teste(
    teste_id: int,
    dados: AplicacaoTesteUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(AplicacaoTeste).filter(AplicacaoTeste.id == teste_id)
    if usuario.papel != "admin":
        query = query.filter(AplicacaoTeste.usuario_id == usuario.id)
    teste = query.first()
    if not teste:
        raise HTTPException(status_code=404, detail="Registro de teste não encontrado")

    dados_antigos = serializar_modelo(teste)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(teste, campo, valor)

    db.commit()
    db.refresh(teste)

    registrar_audit(
        db, usuario.id, "ATUALIZAR", "aplicacoes_testes", teste.id,
        dados_anteriores=dados_antigos,
        dados_novos=dados.model_dump()
    )
    return formatar_teste_response(teste)


@router.delete("/{teste_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_teste(
    teste_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(AplicacaoTeste).filter(AplicacaoTeste.id == teste_id)
    if usuario.papel != "admin":
        query = query.filter(AplicacaoTeste.usuario_id == usuario.id)
    teste = query.first()
    if not teste:
        raise HTTPException(status_code=404, detail="Registro de teste não encontrado")

    dados_antigos = serializar_modelo(teste)
    db.delete(teste)
    db.commit()

    registrar_audit(db, usuario.id, "EXCLUIR", "aplicacoes_testes", teste_id, dados_anteriores=dados_antigos)
    return None
