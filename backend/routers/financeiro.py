from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Transacao, Paciente, Psicologo, Usuario
from schemas import TransacaoCreate, TransacaoUpdate, TransacaoResponse
from utils.auth import get_usuario_atual
from utils.audit import registrar_audit, serializar_modelo

router = APIRouter(prefix="/financeiro", tags=["Financeiro"])


def formatar_transacao_response(tr: Transacao) -> dict:
    return {
        "id": tr.id,
        "usuario_id": tr.usuario_id,
        "paciente_id": tr.paciente_id,
        "psicologo_id": tr.psicologo_id,
        "descricao": tr.descricao,
        "tipo": tr.tipo,
        "categoria": tr.categoria,
        "valor": tr.valor,
        "data": tr.data,
        "status": tr.status,
        "forma_pagamento": tr.forma_pagamento,
        "observacoes": tr.observacoes,
        "criado_em": tr.criado_em,
        "atualizado_em": tr.atualizado_em,
        "paciente_nome": tr.paciente.nome if tr.paciente else None,
        "psicologo_nome": tr.psicologo.nome if tr.psicologo else None,
    }


@router.get("/", response_model=list[TransacaoResponse])
def listar_transacoes(
    data_inicio: date | None = None,
    data_fim: date | None = None,
    tipo: str | None = None,
    status: str | None = None,
    paciente_id: int | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Transacao)
    if usuario.papel != "admin":
        query = query.filter(Transacao.usuario_id == usuario.id)

    if data_inicio:
        query = query.filter(Transacao.data >= data_inicio)
    if data_fim:
        query = query.filter(Transacao.data <= data_fim)
    if tipo:
        query = query.filter(Transacao.tipo == tipo)
    if status:
        query = query.filter(Transacao.status == status)
    if paciente_id:
        query = query.filter(Transacao.paciente_id == paciente_id)

    itens = query.order_by(Transacao.data.desc(), Transacao.id.desc()).all()
    return [formatar_transacao_response(tr) for tr in itens]


@router.get("/fluxo-caixa")
def resumo_fluxo_caixa(
    ano: int | None = None,
    mes: int | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Transacao)
    if usuario.papel != "admin":
        query = query.filter(Transacao.usuario_id == usuario.id)

    transacoes = query.all()

    total_receitas = sum(t.valor for t in transacoes if t.tipo == "Receita" and t.status == "Recebido")
    receitas_pendentes = sum(t.valor for t in transacoes if t.tipo == "Receita" and t.status == "Pendente")
    total_despesas = sum(t.valor for t in transacoes if t.tipo == "Despesa" and t.status == "Pago")
    despesas_pendentes = sum(t.valor for t in transacoes if t.tipo == "Despesa" and t.status == "Pendente")
    saldo_atual = total_receitas - total_despesas

    # Agrupamento por categoria
    categorias = {}
    for t in transacoes:
        cat = t.categoria or "Outros"
        if cat not in categorias:
            categorias[cat] = {"receitas": 0.0, "despesas": 0.0}
        if t.tipo == "Receita":
            categorias[cat]["receitas"] += t.valor
        else:
            categorias[cat]["despesas"] += t.valor

    return {
        "total_receitas": round(total_receitas, 2),
        "receitas_pendentes": round(receitas_pendentes, 2),
        "total_despesas": round(total_despesas, 2),
        "despesas_pendentes": round(despesas_pendentes, 2),
        "saldo_atual": round(saldo_atual, 2),
        "por_categoria": categorias,
        "total_transacoes": len(transacoes)
    }


@router.post("/", response_model=TransacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_transacao(
    dados: TransacaoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    tr = Transacao(usuario_id=usuario.id, **dados.model_dump())
    db.add(tr)
    db.commit()
    db.refresh(tr)

    registrar_audit(db, usuario.id, "CRIAR", "transacoes", tr.id, dados_novos=dados.model_dump())
    return formatar_transacao_response(tr)


@router.get("/{transacao_id}", response_model=TransacaoResponse)
def obter_transacao(
    transacao_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Transacao).filter(Transacao.id == transacao_id)
    if usuario.papel != "admin":
        query = query.filter(Transacao.usuario_id == usuario.id)
    tr = query.first()
    if not tr:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return formatar_transacao_response(tr)


@router.put("/{transacao_id}", response_model=TransacaoResponse)
def atualizar_transacao(
    transacao_id: int,
    dados: TransacaoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Transacao).filter(Transacao.id == transacao_id)
    if usuario.papel != "admin":
        query = query.filter(Transacao.usuario_id == usuario.id)
    tr = query.first()
    if not tr:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    dados_antigos = serializar_modelo(tr)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(tr, campo, valor)

    db.commit()
    db.refresh(tr)

    registrar_audit(
        db, usuario.id, "ATUALIZAR", "transacoes", tr.id,
        dados_anteriores=dados_antigos,
        dados_novos=dados.model_dump()
    )
    return formatar_transacao_response(tr)


@router.delete("/{transacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_transacao(
    transacao_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Transacao).filter(Transacao.id == transacao_id)
    if usuario.papel != "admin":
        query = query.filter(Transacao.usuario_id == usuario.id)
    tr = query.first()
    if not tr:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    dados_antigos = serializar_modelo(tr)
    db.delete(tr)
    db.commit()

    registrar_audit(db, usuario.id, "EXCLUIR", "transacoes", transacao_id, dados_anteriores=dados_antigos)
    return None
