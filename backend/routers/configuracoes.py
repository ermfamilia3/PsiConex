from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Configuracao, Usuario
from schemas import ConfiguracaoCreate, ConfiguracaoResponse
from utils.auth import get_usuario_atual
from utils.audit import registrar_audit

router = APIRouter(prefix="/configuracoes", tags=["Configurações"])


@router.get("/")
def obter_todas_configuracoes(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    configs = db.query(Configuracao).filter(Configuracao.usuario_id == usuario.id).all()
    resultado = {c.chave: c.valor for c in configs}
    # Valores padrão se não existirem
    if "nome_clinica" not in resultado:
        resultado["nome_clinica"] = "Minha Clínica PSICO"
    if "email_contato" not in resultado:
        resultado["email_contato"] = usuario.email
    if "modalidade_padrao" not in resultado:
        resultado["modalidade_padrao"] = "Híbrido"
    return resultado


@router.post("/")
def salvar_configuracoes(
    dados: dict[str, str | None],
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    for chave, valor in dados.items():
        conf = db.query(Configuracao).filter(
            Configuracao.usuario_id == usuario.id,
            Configuracao.chave == chave
        ).first()
        if conf:
            conf.valor = valor
        else:
            conf = Configuracao(usuario_id=usuario.id, chave=chave, valor=valor)
            db.add(conf)

    db.commit()
    registrar_audit(db, usuario.id, "ATUALIZAR", "configuracoes")
    return {"mensagem": "Configurações salvas com sucesso!"}
