from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import AuditLog, Usuario
from schemas import AuditLogResponse
from utils.auth import get_usuario_atual

router = APIRouter(prefix="/auditoria", tags=["Auditoria & LGPD"])


@router.get("/", response_model=list[AuditLogResponse])
def listar_logs_auditoria(
    tabela: str | None = None,
    acao: str | None = None,
    limite: int = 100,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(AuditLog)
    if usuario.papel != "admin":
        query = query.filter(AuditLog.usuario_id == usuario.id)

    if tabela:
        query = query.filter(AuditLog.tabela == tabela)
    if acao:
        query = query.filter(AuditLog.acao == acao)

    return query.order_by(AuditLog.timestamp.desc()).limit(limite).all()
