"""
RBAC — Controle de acesso baseado em papéis.
Papéis: admin, psicologo, secretaria
"""

import os
from functools import wraps
from fastapi import HTTPException, status

ADMIN_PRINCIPAL_EMAIL = os.getenv("ADMIN_EMAIL", "admin@clinicapsico.com.br")


def is_admin_principal(usuario, db=None) -> bool:
    """
    Verifica se o usuário é o Administrador Principal do sistema.
    O Administrador Principal é o detentor da autoridade máxima para cadastrar psicólogos.
    """
    if not usuario or getattr(usuario, "papel", None) != "admin":
        return False

    admin_email = os.getenv("ADMIN_EMAIL", ADMIN_PRINCIPAL_EMAIL).strip().lower()
    user_email = (getattr(usuario, "email", "") or "").strip().lower()
    user_id = getattr(usuario, "id", None)

    # 1. É admin principal se for o ID 1 ou se o e-mail for o configurado
    if user_id == 1 or (user_email and user_email == admin_email):
        return True

    # 2. Se houver sessão de banco e não houver ID 1, verifica o primeiro admin cadastrado
    if db:
        try:
            from models import Usuario
            primeiro_admin = db.query(Usuario).filter(Usuario.papel == "admin").order_by(Usuario.id.asc()).first()
            if primeiro_admin and primeiro_admin.id == user_id:
                return True
        except Exception:
            pass

    return False


def exigir_admin_principal(usuario, db=None):
    """Dependency / guard: lança 403 se não for o administrador principal."""
    if not is_admin_principal(usuario, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o administrador principal pode cadastrar novos psicólogos."
        )
    return usuario


def exigir_papel(*papeis_permitidos: str):
    """
    Dependency factory: verifica se o usuário tem um dos papéis permitidos.

    Uso:
        @router.get("/...", dependencies=[Depends(exigir_papel("admin"))])
        def rota_admin(...): ...

    Ou como guard no corpo:
        verificar_papel(usuario, "admin", "psicologo")
    """
    def guard(usuario):
        if usuario.papel not in papeis_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso restrito. Papel necessário: {', '.join(papeis_permitidos)}",
            )
        return usuario
    return guard


def verificar_papel(usuario, *papeis_permitidos: str):
    """Verificação inline de papel — lança 403 se não autorizado."""
    if usuario.papel not in papeis_permitidos:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acesso restrito. Papel necessário: {', '.join(papeis_permitidos)}",
        )


def verificar_proprietario(usuario, recurso, campo="usuario_id"):
    """Verifica se o recurso pertence ao usuário autenticado."""
    owner_id = getattr(recurso, campo, None)
    if owner_id is None or owner_id != usuario.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este recurso.",
        )
