import os
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models import Usuario
from schemas import UsuarioCreate, UsuarioUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)

def verificar_senha(senha: str, hash_salvo: str) -> bool:
    return pwd_context.verify(senha, hash_salvo)

def criar_usuario(db: Session, usuario_dados: UsuarioCreate) -> Usuario | None:
    usuario_existente = db.query(Usuario).filter(Usuario.email == usuario_dados.email).first()
    if usuario_existente:
        return None
    novo_usuario = Usuario(
        nome=usuario_dados.nome,
        email=usuario_dados.email,
        senha=hash_senha(usuario_dados.senha),
        papel=usuario_dados.papel or "psicologo",
        ativo=True
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

def autenticar_usuario(db: Session, email: str, senha: str) -> Usuario | None:
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario or not verificar_senha(senha, usuario.senha):
        return None
    return usuario

def atualizar_usuario(db: Session, usuario_id: int, dados: UsuarioUpdate) -> Usuario | str | None:
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        return None
    if dados.email != usuario.email:
        existente = db.query(Usuario).filter(Usuario.email == dados.email).first()
        if existente:
            return "email_duplicado"
    usuario.nome = dados.nome
    usuario.email = dados.email
    db.commit()
    db.refresh(usuario)
    return usuario

def excluir_usuario(db: Session, usuario_id: int) -> Usuario | None:
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        return None
    db.delete(usuario)
    db.commit()
    return usuario
