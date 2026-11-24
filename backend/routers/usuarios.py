import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario
from schemas import UsuarioCreate, UsuarioUpdate, UsuarioResponse, UsuarioLogin
from services.usuario_service import (
    criar_usuario,
    autenticar_usuario,
    atualizar_usuario,
    excluir_usuario,
)
from utils.auth import get_usuario_atual
from utils.audit import registrar_audit

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "chave_secreta_padrao_para_desenvolvimento_trocar_em_prod")
ALGORITHM = "HS256"

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


@router.post("/", response_model=UsuarioResponse, status_code=201)
def cadastrar_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    if usuario_atual.papel != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o administrador principal pode cadastrar novos usuários ou psicólogos."
        )
    novo_usuario = criar_usuario(db, usuario)
    if novo_usuario is None:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")
    registrar_audit(db, usuario_atual.id, "CRIAR", "usuarios", novo_usuario.id, dados_novos={"email": usuario.email, "nome": usuario.nome})
    return novo_usuario


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = autenticar_usuario(db, form_data.username, form_data.password)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Conta desativada")

    expiracao = datetime.now(timezone.utc) + timedelta(hours=8)
    token = jwt.encode(
        {"sub": str(usuario.id), "email": usuario.email, "papel": usuario.papel, "exp": expiracao},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    registrar_audit(db, usuario.id, "LOGIN", "usuarios", usuario.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nome": usuario.nome,
            "email": usuario.email,
            "papel": usuario.papel
        }
    }


@router.get("/me", response_model=UsuarioResponse)
def obter_meu_perfil(usuario_atual: Usuario = Depends(get_usuario_atual)):
    return usuario_atual


@router.get("/", response_model=list[UsuarioResponse])
def listar_usuarios(
    usuario_atual: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db)
):
    # Se admin, lista todos; se comum, retorna a si mesmo
    if usuario_atual.papel == "admin":
        return db.query(Usuario).all()
    return [usuario_atual]


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obter_usuario_por_id(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    if usuario_atual.id != usuario_id and usuario_atual.papel != "admin":
        raise HTTPException(status_code=403, detail="Você não tem permissão para consultar outro usuário")
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def atualizar_usuario_rota(
    usuario_id: int,
    dados: UsuarioUpdate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    if usuario_atual.id != usuario_id and usuario_atual.papel != "admin":
        raise HTTPException(status_code=403, detail="Você não pode alterar outro usuário")

    usuario = atualizar_usuario(db, usuario_id, dados)
    if usuario == "email_duplicado":
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario


@router.delete("/{usuario_id}")
def excluir_usuario_rota(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_usuario_atual),
):
    if usuario_atual.id != usuario_id and usuario_atual.papel != "admin":
        raise HTTPException(status_code=403, detail="Você não pode excluir outro usuário")

    usuario = excluir_usuario(db, usuario_id)
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"mensagem": "Usuário excluído com sucesso"}
