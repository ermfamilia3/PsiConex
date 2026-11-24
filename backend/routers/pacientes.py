from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from models import Paciente, Usuario
from schemas import PacienteCreate, PacienteUpdate, PacienteResponse
from utils.auth import get_usuario_atual
from utils.audit import registrar_audit, serializar_modelo

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


def obter_paciente_db(db: Session, usuario_id: int, paciente_id: int, usuario_papel: str) -> Paciente:
    query = db.query(Paciente).filter(Paciente.id == paciente_id)
    if usuario_papel != "admin":
        query = query.filter(Paciente.usuario_id == usuario_id)
    paciente = query.first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return paciente


@router.get("/", response_model=list[PacienteResponse])
def listar_pacientes(
    busca: str | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Paciente)
    if usuario.papel != "admin":
        query = query.filter(Paciente.usuario_id == usuario.id)

    if busca:
        termo = f"%{busca.strip()}%"
        query = query.filter(
            or_(
                Paciente.nome.ilike(termo),
                Paciente.cpf.ilike(termo),
                Paciente.telefone.ilike(termo),
                Paciente.email.ilike(termo),
            )
        )
    return query.order_by(Paciente.nome).all()


@router.post("/", response_model=PacienteResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_paciente(
    dados: PacienteCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    if dados.cpf:
        cpf_existente = db.query(Paciente).filter(
            Paciente.usuario_id == usuario.id,
            Paciente.cpf == dados.cpf
        ).first()
        if cpf_existente:
            raise HTTPException(status_code=400, detail="Já existe um paciente com este CPF.")

    dados_dict = dados.model_dump()
    if dados_dict.get("consentimento_lgpd"):
        dados_dict["data_consentimento"] = datetime.now(timezone.utc)

    paciente = Paciente(usuario_id=usuario.id, **dados_dict)
    db.add(paciente)
    db.commit()
    db.refresh(paciente)

    registrar_audit(
        db, usuario.id, "CRIAR", "pacientes", paciente.id,
        dados_novos=dados_dict
    )
    return paciente


@router.get("/{paciente_id}", response_model=PacienteResponse)
def obter_detalhes_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    return obter_paciente_db(db, usuario.id, paciente_id, usuario.papel)


@router.put("/{paciente_id}", response_model=PacienteResponse)
def atualizar_paciente(
    paciente_id: int,
    dados: PacienteUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    paciente = obter_paciente_db(db, usuario.id, paciente_id, usuario.papel)
    dados_antigos = serializar_modelo(paciente)

    if dados.cpf and dados.cpf != paciente.cpf:
        cpf_existente = db.query(Paciente).filter(
            Paciente.usuario_id == usuario.id,
            Paciente.cpf == dados.cpf,
            Paciente.id != paciente_id,
        ).first()
        if cpf_existente:
            raise HTTPException(status_code=400, detail="Já existe outro paciente com este CPF.")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        if campo == "consentimento_lgpd" and valor and not paciente.consentimento_lgpd:
            setattr(paciente, "data_consentimento", datetime.now(timezone.utc))
        setattr(paciente, campo, valor)

    db.commit()
    db.refresh(paciente)

    registrar_audit(
        db, usuario.id, "ATUALIZAR", "pacientes", paciente.id,
        dados_anteriores=dados_antigos,
        dados_novos=dados.model_dump()
    )
    return paciente


@router.delete("/{paciente_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    paciente = obter_paciente_db(db, usuario.id, paciente_id, usuario.papel)
    dados_antigos = serializar_modelo(paciente)

    db.delete(paciente)
    db.commit()

    registrar_audit(
        db, usuario.id, "EXCLUIR", "pacientes", paciente_id,
        dados_anteriores=dados_antigos
    )
    return None
