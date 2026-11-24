"""
RBAC — Controle de acesso baseado em papéis.
Papéis: admin, psicologo, secretaria
"""

from functools import wraps
from fastapi import HTTPException, status


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
