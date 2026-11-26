import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent / ".env")

from database import Base, engine
import models  # Garante registro de todos os modelos
from routers import (
    usuarios,
    pacientes,
    psicologos,
    agenda,
    prontuarios,
    financeiro,
    documentos,
    testes,
    planos,
    auditoria,
    relatorios,
    configuracoes,
)

app = FastAPI(
    title="Clínica PSICO API — v2.0 Integrada",
    description="Sistema completo de gestão clínica, prontuários, agendamentos com Jitsi Meet, financeiro, emissão de PDF e cobrança.",
    version="2.0.0",
)

origens = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origem.strip() for origem in origens.split(",") if origem.strip()] + ["*"],
    allow_origin_regex=r"^https?:\/\/.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de todas as rotas integradas
app.include_router(usuarios.router)
app.include_router(pacientes.router)
app.include_router(psicologos.router)
app.include_router(agenda.router)
app.include_router(prontuarios.router)
app.include_router(financeiro.router)
app.include_router(documentos.router)
app.include_router(testes.router)
app.include_router(planos.router)
app.include_router(auditoria.router)
app.include_router(relatorios.router)
app.include_router(configuracoes.router)

# Criação automática de tabelas na inicialização do banco
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[DB WARN] Tabelas não puderam ser criadas automaticamente no startup: {e}")


@app.get("/")
def inicio():
    return {
        "sistema": "Clínica PSICO",
        "versao": "2.0.0",
        "status": "online",
        "docs": "/docs",
        "modulos": [
            "usuarios", "pacientes", "psicologos", "agenda",
            "prontuarios", "financeiro", "documentos", "testes",
            "planos", "auditoria", "relatorios", "configuracoes"
        ]
    }


@app.get("/health")
def health():
    return {"status": "ok", "versao": "2.0.0"}
