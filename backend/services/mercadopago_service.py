import os
import uuid
import httpx
from dotenv import load_dotenv

load_dotenv()

MP_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")

async def criar_preferencia_pagamento(
    plano_nome: str,
    valor: float,
    usuario_email: str,
    usuario_nome: str,
    back_urls: dict = None
) -> dict:
    """
    Cria uma preferência de pagamento no Mercado Pago.
    Retorna o link de checkout e o id da preferência.
    """
    if not MP_ACCESS_TOKEN:
        # Modo simulação / sandbox quando a chave ainda não estiver configurada no .env
        fake_id = f"mock_mp_{uuid.uuid4().hex[:12]}"
        return {
            "id": fake_id,
            "init_point": f"https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id={fake_id}",
            "sandbox_init_point": f"https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id={fake_id}",
            "status": "simulado",
            "mensagem": "Token do Mercado Pago não configurado. Modo simulação ativo."
        }

    url = "https://api.mercadopago.com/checkout/preferences"
    headers = {
        "Authorization": f"Bearer {MP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "items": [
            {
                "title": f"Assinatura Clínica PSICO — Plano {plano_nome}",
                "quantity": 1,
                "unit_price": float(valor),
                "currency_id": "BRL"
            }
        ],
        "payer": {
            "name": usuario_nome,
            "email": usuario_email
        },
        "back_urls": back_urls or {
            "success": "http://localhost:5173/?status=success",
            "failure": "http://localhost:5173/?status=failure",
            "pending": "http://localhost:5173/?status=pending"
        },
        "auto_return": "approved"
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers, timeout=10.0)
            if resp.status_code in (200, 201):
                data = resp.json()
                return {
                    "id": data.get("id"),
                    "init_point": data.get("init_point"),
                    "sandbox_init_point": data.get("sandbox_init_point"),
                    "status": "criado"
                }
            else:
                return {
                    "id": None,
                    "init_point": None,
                    "status": "erro",
                    "erro": resp.text
                }
    except Exception as e:
        return {
            "id": None,
            "init_point": None,
            "status": "erro",
            "erro": str(e)
        }
