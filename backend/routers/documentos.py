import io
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from database import get_db
from models import Documento, Paciente, Psicologo, Usuario
from schemas import DocumentoCreate, DocumentoUpdate, DocumentoResponse
from utils.auth import get_usuario_atual
from utils.audit import registrar_audit, serializar_modelo
from services.pdf_service import gerar_documento_pdf

router = APIRouter(prefix="/documentos", tags=["Documentos"])


def formatar_documento_response(doc: Documento) -> dict:
    return {
        "id": doc.id,
        "usuario_id": doc.usuario_id,
        "paciente_id": doc.paciente_id,
        "psicologo_id": doc.psicologo_id,
        "tipo": doc.tipo,
        "titulo": doc.titulo,
        "conteudo": doc.conteudo,
        "data": doc.data,
        "status": doc.status,
        "arquivo_pdf": doc.arquivo_pdf,
        "criado_em": doc.criado_em,
        "atualizado_em": doc.atualizado_em,
        "paciente_nome": doc.paciente.nome if doc.paciente else "Paciente removido",
        "psicologo_nome": doc.psicologo.nome if doc.psicologo else "Não atribuído",
    }


@router.get("/", response_model=list[DocumentoResponse])
def listar_documentos(
    paciente_id: int | None = None,
    tipo: str | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Documento)
    if usuario.papel != "admin":
        query = query.filter(Documento.usuario_id == usuario.id)

    if paciente_id:
        query = query.filter(Documento.paciente_id == paciente_id)
    if tipo:
        query = query.filter(Documento.tipo == tipo)

    itens = query.order_by(Documento.data.desc(), Documento.id.desc()).all()
    return [formatar_documento_response(d) for d in itens]


@router.post("/", response_model=DocumentoResponse, status_code=status.HTTP_201_CREATED)
def criar_documento(
    dados: DocumentoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    paciente = db.query(Paciente).filter(Paciente.id == dados.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    doc = Documento(usuario_id=usuario.id, **dados.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)

    registrar_audit(db, usuario.id, "CRIAR", "documentos", doc.id, dados_novos=dados.model_dump())
    return formatar_documento_response(doc)


@router.get("/{documento_id}", response_model=DocumentoResponse)
def obter_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Documento).filter(Documento.id == documento_id)
    if usuario.papel != "admin":
        query = query.filter(Documento.usuario_id == usuario.id)
    doc = query.first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    return formatar_documento_response(doc)


@router.get("/{documento_id}/pdf")
def baixar_documento_pdf(
    documento_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Documento).filter(Documento.id == documento_id)
    if usuario.papel != "admin":
        query = query.filter(Documento.usuario_id == usuario.id)
    doc = query.first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    paciente = doc.paciente
    psicologo = doc.psicologo

    pdf_bytes = gerar_documento_pdf(
        tipo=doc.tipo,
        titulo=doc.titulo,
        conteudo=doc.conteudo,
        data_doc=str(doc.data),
        paciente_nome=paciente.nome if paciente else "Paciente",
        paciente_cpf=paciente.cpf if paciente else None,
        psicologo_nome=psicologo.nome if psicologo else usuario.nome,
        psicologo_crp=psicologo.crp if psicologo else "Não informado"
    )

    registrar_audit(db, usuario.id, "GERAR_PDF", "documentos", doc.id)

    filename = f"{doc.tipo.lower()}_{doc.id}.pdf".replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )


@router.put("/{documento_id}", response_model=DocumentoResponse)
def atualizar_documento(
    documento_id: int,
    dados: DocumentoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Documento).filter(Documento.id == documento_id)
    if usuario.papel != "admin":
        query = query.filter(Documento.usuario_id == usuario.id)
    doc = query.first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    dados_antigos = serializar_modelo(doc)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(doc, campo, valor)

    db.commit()
    db.refresh(doc)

    registrar_audit(
        db, usuario.id, "ATUALIZAR", "documentos", doc.id,
        dados_anteriores=dados_antigos,
        dados_novos=dados.model_dump()
    )
    return formatar_documento_response(doc)


@router.delete("/{documento_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Documento).filter(Documento.id == documento_id)
    if usuario.papel != "admin":
        query = query.filter(Documento.usuario_id == usuario.id)
    doc = query.first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    dados_antigos = serializar_modelo(doc)
    db.delete(doc)
    db.commit()

    registrar_audit(db, usuario.id, "EXCLUIR", "documentos", documento_id, dados_anteriores=dados_antigos)
    return None
