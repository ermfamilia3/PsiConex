import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app
from models import Usuario
from services.usuario_service import hash_senha

# SQLite em memória para testes unitários rápidos e isolados
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

Base.metadata.create_all(bind=engine_test)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module")
def token_auth():
    # Cria usuário de teste no banco em memória
    db = TestingSessionLocal()
    user = Usuario(
        nome="Dra. Roberta Psicóloga",
        email="roberta@clinicapsico.com.br",
        senha=hash_senha("SenhaForte123"),
        papel="psicologo",
        ativo=True,
    )
    db.add(user)
    db.commit()
    db.close()

    # Faz login
    resp = client.post(
        "/usuarios/login",
        data={"username": "roberta@clinicapsico.com.br", "password": "SenhaForte123"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_cadastrar_paciente(token_auth):
    dados = {
        "nome": "Carlos Drummond",
        "cpf": "123.456.789-00",
        "email": "carlos@example.com",
        "telefone": "(11) 98765-4321",
        "modalidade": "On-line",
        "status": "Ativo",
        "consentimento_lgpd": True,
    }
    response = client.post("/pacientes/", json=dados, headers=token_auth)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["nome"] == "Carlos Drummond"
    assert res_data["consentimento_lgpd"] is True


def test_listar_pacientes(token_auth):
    response = client.get("/pacientes/", headers=token_auth)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_criar_psicologo(token_auth):
    dados = {
        "nome": "Dra. Roberta Silva",
        "crp": "06/123456",
        "especialidade": "Terapia Cognitivo-Comportamental",
        "email": "roberta@clinica.com",
        "status": "Ativo"
    }
    response = client.post("/psicologos/", json=dados, headers=token_auth)
    assert response.status_code == 201
    assert response.json()["crp"] == "06/123456"


def test_agendamento_online_jitsi(token_auth):
    # Pega paciente criado
    pats = client.get("/pacientes/", headers=token_auth).json()
    paciente_id = pats[0]["id"]

    dados = {
        "paciente_id": paciente_id,
        "data": "2026-11-20",
        "hora_inicio": "14:00",
        "hora_fim": "14:50",
        "modalidade": "On-line",
        "status": "Confirmado"
    }
    response = client.post("/agenda/", json=dados, headers=token_auth)
    assert response.status_code == 201
    ag = response.json()
    assert ag["modalidade"] == "On-line"
    assert "meet.jit.si" in ag["link_sala"]  # Verifica geração automática do Jitsi Meet


def test_prontuario_com_criptografia(token_auth):
    pats = client.get("/pacientes/", headers=token_auth).json()
    paciente_id = pats[0]["id"]

    dados = {
        "paciente_id": paciente_id,
        "data": "2026-11-20",
        "tipo": "Evolução de sessão",
        "evolucao": "Paciente relatou melhora nos sintomas de ansiedade e adesão às técnicas.",
        "conduta": "Manter exercícios de respiração diafragmática."
    }
    response = client.post("/prontuarios/", json=dados, headers=token_auth)
    assert response.status_code == 201
    pr = response.json()
    assert pr["evolucao"] == "Paciente relatou melhora nos sintomas de ansiedade e adesão às técnicas."


def test_financeiro_fluxo_caixa(token_auth):
    dados = {
        "descricao": "Consulta de psicoterapia individual",
        "tipo": "Receita",
        "categoria": "Atendimento",
        "valor": 180.00,
        "data": "2026-11-20",
        "status": "Recebido"
    }
    client.post("/financeiro/", json=dados, headers=token_auth)

    fluxo = client.get("/financeiro/fluxo-caixa", headers=token_auth)
    assert fluxo.status_code == 200
    res = fluxo.json()
    assert res["total_receitas"] >= 180.00


def test_emissao_documento_e_pdf(token_auth):
    pats = client.get("/pacientes/", headers=token_auth).json()
    paciente_id = pats[0]["id"]

    dados = {
        "paciente_id": paciente_id,
        "tipo": "Declaração",
        "titulo": "Declaração de Comparecimento",
        "conteudo": "Declaro para os devidos fins que o paciente compareceu à sessão no dia de hoje.",
        "data": "2026-11-20",
        "status": "Finalizado"
    }
    resp = client.post("/documentos/", json=dados, headers=token_auth)
    assert resp.status_code == 201
    doc_id = resp.json()["id"]

    pdf_resp = client.get(f"/documentos/{doc_id}/pdf", headers=token_auth)
    assert pdf_resp.status_code == 200
    assert "pdf" in pdf_resp.headers.get("content-type", "")


def test_planos_e_checkout_mercadopago(token_auth):
    cat = client.get("/planos/catalogo")
    assert cat.status_code == 200
    assert len(cat.json()) == 2

    chk = client.post("/planos/checkout?plano_nome=Premium", headers=token_auth)
    assert chk.status_code == 200
    assert chk.json()["plano"] == "Premium"
    assert "checkout_url" in chk.json()


def test_auditoria_logs(token_auth):
    resp = client.get("/auditoria/", headers=token_auth)
    assert resp.status_code == 200
    logs = resp.json()
    assert len(logs) > 0
