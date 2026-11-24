import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Agendamento, Paciente, Psicologo, Usuario
from schemas import AgendamentoCreate, AgendamentoUpdate, AgendamentoResponse
from utils.auth import get_usuario_atual
from utils.audit import registrar_audit, serializar_modelo
from services.email_service import enviar_notificacao_agendamento

router = APIRouter(prefix="/agenda", tags=["Agenda"])


def formatar_agendamento_response(ag: Agendamento) -> dict:
    dados = {
        "id": ag.id,
        "usuario_id": ag.usuario_id,
        "paciente_id": ag.paciente_id,
        "psicologo_id": ag.psicologo_id,
        "data": ag.data,
        "hora_inicio": ag.hora_inicio,
        "hora_fim": ag.hora_fim,
        "tipo": ag.tipo,
        "modalidade": ag.modalidade,
        "status": ag.status,
        "link_sala": ag.link_sala,
        "observacoes": ag.observacoes,
        "criado_em": ag.criado_em,
        "atualizado_em": ag.atualizado_em,
        "paciente_nome": ag.paciente.nome if ag.paciente else "Paciente removido",
        "psicologo_nome": ag.psicologo.nome if ag.psicologo else "Não atribuído",
    }
    return dados


@router.get("/", response_model=list[AgendamentoResponse])
def listar_agendamentos(
    data_inicio: date | None = None,
    data_fim: date | None = None,
    paciente_id: int | None = None,
    psicologo_id: int | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Agendamento)
    if usuario.papel != "admin":
        query = query.filter(Agendamento.usuario_id == usuario.id)

    if data_inicio:
        query = query.filter(Agendamento.data >= data_inicio)
    if data_fim:
        query = query.filter(Agendamento.data <= data_fim)
    if paciente_id:
        query = query.filter(Agendamento.paciente_id == paciente_id)
    if psicologo_id:
        query = query.filter(Agendamento.psicologo_id == psicologo_id)

    itens = query.order_by(Agendamento.data.asc(), Agendamento.hora_inicio.asc()).all()
    return [formatar_agendamento_response(ag) for ag in itens]


@router.post("/", response_model=AgendamentoResponse, status_code=status.HTTP_201_CREATED)
def criar_agendamento(
    dados: AgendamentoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    # Valida paciente
    paciente = db.query(Paciente).filter(Paciente.id == dados.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    # Valida psicólogo se informado
    if dados.psicologo_id:
        psico = db.query(Psicologo).filter(Psicologo.id == dados.psicologo_id).first()
        if not psico:
            raise HTTPException(status_code=404, detail="Psicólogo não encontrado")

    dados_dict = dados.model_dump()

    # Se for online e não tiver link de sala, gera sala Jitsi Meet integrada
    if dados.modalidade in ("On-line", "Híbrido") and not dados_dict.get("link_sala"):
        sala_token = uuid.uuid4().hex[:10]
        dados_dict["link_sala"] = f"https://meet.jit.si/ClinicaPSICO_{sala_token}"

    agendamento = Agendamento(usuario_id=usuario.id, **dados_dict)
    db.add(agendamento)
    db.commit()
    db.refresh(agendamento)

    # Notificação por email se houver
    if paciente.email:
        enviar_notificacao_agendamento(
            paciente_nome=paciente.nome,
            email=paciente.email,
            data=str(agendamento.data),
            hora=agendamento.hora_inicio,
            modalidade=agendamento.modalidade,
            link_sala=agendamento.link_sala
        )

    registrar_audit(db, usuario.id, "CRIAR", "agendamentos", agendamento.id, dados_novos=dados_dict)
    return formatar_agendamento_response(agendamento)


@router.get("/{agendamento_id}", response_model=AgendamentoResponse)
def obter_agendamento(
    agendamento_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Agendamento).filter(Agendamento.id == agendamento_id)
    if usuario.papel != "admin":
        query = query.filter(Agendamento.usuario_id == usuario.id)
    ag = query.first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    return formatar_agendamento_response(ag)


@router.put("/{agendamento_id}", response_model=AgendamentoResponse)
def atualizar_agendamento(
    agendamento_id: int,
    dados: AgendamentoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Agendamento).filter(Agendamento.id == agendamento_id)
    if usuario.papel != "admin":
        query = query.filter(Agendamento.usuario_id == usuario.id)
    ag = query.first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    dados_antigos = serializar_modelo(ag)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(ag, campo, valor)

    db.commit()
    db.refresh(ag)

    registrar_audit(
        db, usuario.id, "ATUALIZAR", "agendamentos", ag.id,
        dados_anteriores=dados_antigos,
        dados_novos=dados.model_dump()
    )
    return formatar_agendamento_response(ag)


@router.delete("/{agendamento_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_agendamento(
    agendamento_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Agendamento).filter(Agendamento.id == agendamento_id)
    if usuario.papel != "admin":
        query = query.filter(Agendamento.usuario_id == usuario.id)
    ag = query.first()
    if not ag:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    dados_antigos = serializar_modelo(ag)
    db.delete(ag)
    db.commit()

    registrar_audit(db, usuario.id, "EXCLUIR", "agendamentos", agendamento_id, dados_anteriores=dados_antigos)
    return None
