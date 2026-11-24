from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Psicologo, Usuario
from schemas import PsicologoCreate, PsicologoUpdate, PsicologoResponse
from services.usuario_service import hash_senha
from utils.auth import get_usuario_atual
from utils.audit import registrar_audit, serializar_modelo

router = APIRouter(prefix="/psicologos", tags=["Psicólogos"])


def obter_psicologo_db(db: Session, usuario_id: int, psicologo_id: int, papel: str) -> Psicologo:
    query = db.query(Psicologo).filter(Psicologo.id == psicologo_id)
    if papel != "admin":
        query = query.filter(Psicologo.usuario_id == usuario_id)
    psico = query.first()
    if not psico:
        raise HTTPException(status_code=404, detail="Psicólogo não encontrado")
    return psico


@router.get("/", response_model=list[PsicologoResponse])
def listar_psicologos(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Psicologo)
    if usuario.papel != "admin":
        query = query.filter(Psicologo.usuario_id == usuario.id)
    return query.order_by(Psicologo.nome).all()


@router.post("/", response_model=PsicologoResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_psicologo(
    dados: PsicologoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if usuario.papel != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o administrador principal pode cadastrar outros psicólogos."
        )

    psico_usuario_id = usuario.id
    if dados.email:
        usuario_existente = db.query(Usuario).filter(Usuario.email == dados.email).first()
        if usuario_existente:
            psico_usuario_id = usuario_existente.id
        else:
            senha_inicial = dados.senha if (dados.senha and len(dados.senha.strip()) >= 6) else "Psi@123456"
            novo_usuario = Usuario(
                nome=dados.nome,
                email=dados.email,
                senha=hash_senha(senha_inicial),
                papel="psicologo",
                ativo=True
            )
            db.add(novo_usuario)
            db.commit()
            db.refresh(novo_usuario)
            psico_usuario_id = novo_usuario.id
            registrar_audit(
                db, usuario.id, "CRIAR", "usuarios", novo_usuario.id,
                dados_novos={"email": novo_usuario.email, "nome": novo_usuario.nome, "papel": "psicologo"}
            )

    dados_dict = dados.model_dump()
    dados_dict.pop("senha", None)

    psico = Psicologo(usuario_id=psico_usuario_id, **dados_dict)
    db.add(psico)
    db.commit()
    db.refresh(psico)

    registrar_audit(db, usuario.id, "CRIAR", "psicologos", psico.id, dados_novos=dados_dict)
    return psico


@router.get("/{psicologo_id}", response_model=PsicologoResponse)
def obter_psicologo(
    psicologo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    return obter_psicologo_db(db, usuario.id, psicologo_id, usuario.papel)


@router.put("/{psicologo_id}", response_model=PsicologoResponse)
def atualizar_psicologo(
    psicologo_id: int,
    dados: PsicologoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if usuario.papel != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o administrador principal pode alterar o cadastro de outros psicólogos."
        )

    psico = obter_psicologo_db(db, usuario.id, psicologo_id, usuario.papel)
    dados_antigos = serializar_modelo(psico)

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(psico, campo, valor)

    db.commit()
    db.refresh(psico)

    registrar_audit(
        db, usuario.id, "ATUALIZAR", "psicologos", psico.id,
        dados_anteriores=dados_antigos,
        dados_novos=dados.model_dump()
    )
    return psico


@router.delete("/{psicologo_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_psicologo(
    psicologo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if usuario.papel != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o administrador principal pode excluir psicólogos."
        )

    psico = obter_psicologo_db(db, usuario.id, psicologo_id, usuario.papel)
    dados_antigos = serializar_modelo(psico)

    db.delete(psico)
    db.commit()

    registrar_audit(db, usuario.id, "EXCLUIR", "psicologos", psicologo_id, dados_anteriores=dados_antigos)
    return None
