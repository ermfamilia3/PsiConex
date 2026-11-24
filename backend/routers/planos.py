from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from database import get_db
from models import Assinatura, Usuario
from schemas import AssinaturaCreate, AssinaturaUpdate, AssinaturaResponse
from utils.auth import get_usuario_atual
from utils.audit import registrar_audit
from services.mercadopago_service import criar_preferencia_pagamento

router = APIRouter(prefix="/planos", tags=["Planos & Assinaturas"])

PLANOS_CATALOGO = [
    {
        "id": "basico",
        "nome": "Básico",
        "preco": 69.00,
        "periodo": "mês",
        "recursos": [
            "Até 50 pacientes cadastrados",
            "Agenda completa de atendimentos",
            "Prontuário com evolução e histórico",
            "Emissão de documentos e laudos em PDF",
            "Controle financeiro básico",
            "Backup seguro em nuvem"
        ]
    },
    {
        "id": "premium",
        "nome": "Premium",
        "preco": 110.00,
        "periodo": "mês",
        "recursos": [
            "Pacientes ilimitados",
            "Atendimentos on-line com Jitsi Meet integrado",
            "Prontuários ilimitados com criptografia",
            "Correção e controle de testes psicológicos",
            "Fluxo de caixa completo e relatórios gerenciais",
            "Multi-psicólogos por clínica",
            "Auditoria avançada de acessos e LGPD",
            "Suporte prioritário"
        ]
    }
]


@router.get("/catalogo")
def obter_catalogo_planos():
    return PLANOS_CATALOGO


@router.get("/", response_model=list[AssinaturaResponse])
def listar_assinaturas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    query = db.query(Assinatura)
    if usuario.papel != "admin":
        query = query.filter(Assinatura.usuario_id == usuario.id)
    return query.order_by(Assinatura.inicio.desc(), Assinatura.id.desc()).all()


@router.get("/atual")
def obter_plano_atual(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    assinatura = db.query(Assinatura).filter(
        Assinatura.usuario_id == usuario.id,
        Assinatura.status == "Ativo"
    ).order_by(Assinatura.id.desc()).first()

    if not assinatura:
        # Cria plano básico padrão de boas-vindas se não houver
        assinatura = Assinatura(
            usuario_id=usuario.id,
            plano="Básico",
            valor=69.00,
            inicio=date.today(),
            status="Ativo",
            observacoes="Plano inicial gratuito / avaliação"
        )
        db.add(assinatura)
        db.commit()
        db.refresh(assinatura)

    plano_info = next((p for p in PLANOS_CATALOGO if p["nome"].lower() == assinatura.plano.lower()), PLANOS_CATALOGO[0])

    return {
        "assinatura": assinatura,
        "detalhes_plano": plano_info
    }


@router.post("/checkout")
async def iniciar_checkout_plano(
    plano_nome: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    plano_info = next((p for p in PLANOS_CATALOGO if p["nome"].lower() == plano_nome.lower()), None)
    if not plano_info:
        raise HTTPException(status_code=400, detail="Plano não encontrado no catálogo")

    # Gera link Mercado Pago
    mp_res = await criar_preferencia_pagamento(
        plano_nome=plano_info["nome"],
        valor=plano_info["preco"],
        usuario_email=usuario.email,
        usuario_nome=usuario.nome
    )

    # Inativa assinaturas ativas anteriores
    anteriores = db.query(Assinatura).filter(
        Assinatura.usuario_id == usuario.id,
        Assinatura.status == "Ativo"
    ).all()
    for a in anteriores:
        a.status = "Substituído"

    nova_assinatura = Assinatura(
        usuario_id=usuario.id,
        plano=plano_info["nome"],
        valor=plano_info["preco"],
        inicio=date.today(),
        status="Ativo" if mp_res.get("status") == "simulado" else "Pendente",
        mercadopago_id=mp_res.get("id"),
        mercadopago_link=mp_res.get("init_point"),
        observacoes="Assinatura via Mercado Pago"
    )
    db.add(nova_assinatura)
    db.commit()
    db.refresh(nova_assinatura)

    registrar_audit(
        db, usuario.id, "ASSINAR_PLANO", "assinaturas", nova_assinatura.id,
        dados_novos={"plano": plano_info["nome"], "valor": plano_info["preco"]}
    )

    return {
        "assinatura_id": nova_assinatura.id,
        "plano": nova_assinatura.plano,
        "status": nova_assinatura.status,
        "checkout_url": mp_res.get("init_point"),
        "sandbox_url": mp_res.get("sandbox_init_point"),
        "mensagem": "Redirecionando para o Mercado Pago..."
    }


@router.post("/webhook")
async def webhook_mercadopago(request: Request, db: Session = Depends(get_db)):
    """Recebe notificações de pagamento do Mercado Pago."""
    try:
        corpo = await request.json()
        topic = corpo.get("type") or corpo.get("topic")
        data_id = corpo.get("data", {}).get("id") or corpo.get("id")

        if data_id:
            assinatura = db.query(Assinatura).filter(Assinatura.mercadopago_id == str(data_id)).first()
            if assinatura:
                assinatura.status = "Ativo"
                db.commit()
        return {"status": "ok"}
    except Exception:
        return {"status": "ok"}
