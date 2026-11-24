from datetime import date, datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Paciente, Agendamento, Transacao, Prontuario, Documento, Usuario
from schemas import RelatorioResumo
from utils.auth import get_usuario_atual

router = APIRouter(prefix="/relatorios", tags=["Relatórios Administrativos"])


@router.get("/resumo", response_model=RelatorioResumo)
def obter_resumo_gerencial(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    hoje = date.today()
    primeiro_dia_mes = hoje.replace(day=1)

    p_query = db.query(Paciente)
    a_query = db.query(Agendamento)
    t_query = db.query(Transacao)
    pr_query = db.query(Prontuario)
    d_query = db.query(Documento)

    if usuario.papel != "admin":
        p_query = p_query.filter(Paciente.usuario_id == usuario.id)
        a_query = a_query.filter(Agendamento.usuario_id == usuario.id)
        t_query = t_query.filter(Transacao.usuario_id == usuario.id)
        pr_query = pr_query.filter(Prontuario.usuario_id == usuario.id)
        d_query = d_query.filter(Documento.usuario_id == usuario.id)

    total_pacientes = p_query.count()
    pacientes_ativos = p_query.filter(Paciente.status == "Ativo").count()

    total_agendamentos_mes = a_query.filter(Agendamento.data >= primeiro_dia_mes).count()
    agendamentos_hoje = a_query.filter(Agendamento.data == hoje).count()

    transacoes_mes = t_query.filter(Transacao.data >= primeiro_dia_mes).all()
    receitas_mes = sum(t.valor for t in transacoes_mes if t.tipo == "Receita" and t.status == "Recebido")
    despesas_mes = sum(t.valor for t in transacoes_mes if t.tipo == "Despesa" and t.status == "Pago")
    saldo_mes = receitas_mes - despesas_mes

    total_prontuarios = pr_query.count()
    total_documentos = d_query.count()

    return RelatorioResumo(
        total_pacientes=total_pacientes,
        pacientes_ativos=pacientes_ativos,
        total_agendamentos_mes=total_agendamentos_mes,
        agendamentos_hoje=agendamentos_hoje,
        total_receitas_mes=round(receitas_mes, 2),
        total_despesas_mes=round(despesas_mes, 2),
        saldo_mes=round(saldo_mes, 2),
        total_prontuarios=total_prontuarios,
        total_documentos=total_documentos
    )
