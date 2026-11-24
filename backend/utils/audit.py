"""
Auditoria — registra ações no banco para compliance e LGPD.
"""

import json
from sqlalchemy.orm import Session

from models import AuditLog


def registrar_audit(
    db: Session,
    usuario_id: int | None,
    acao: str,
    tabela: str,
    registro_id: int | None = None,
    dados_anteriores: dict | None = None,
    dados_novos: dict | None = None,
    ip: str | None = None,
):
    """Cria um registro de auditoria."""
    log = AuditLog(
        usuario_id=usuario_id,
        acao=acao,
        tabela=tabela,
        registro_id=registro_id,
        dados_anteriores=json.dumps(dados_anteriores, default=str, ensure_ascii=False) if dados_anteriores else None,
        dados_novos=json.dumps(dados_novos, default=str, ensure_ascii=False) if dados_novos else None,
        ip=ip,
    )
    db.add(log)
    db.commit()
    return log


def serializar_modelo(obj) -> dict:
    """Converte um objeto SQLAlchemy em dicionário para auditoria."""
    if obj is None:
        return {}
    result = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name, None)
        result[col.name] = val
    return result
