import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Carrega as variáveis do arquivo .env localizado na pasta do backend ou raiz
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Se DATABASE_URL não estiver configurada no .env, tenta compatibilidade ou fallback
if not DATABASE_URL or DATABASE_URL.strip() == "":
    db_user = os.getenv("DB_USER")
    db_pass = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT", "3306")
    db_name = os.getenv("DB_NAME", "clinica_psico")

    if db_user and db_host:
        DATABASE_URL = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    else:
        # Fallback local em SQLite para testes e desenvolvimento isolado
        DATABASE_URL = "sqlite:///./clinica_psico.db"
        print(
            "\n[AVISO SUPABASE] DATABASE_URL não configurada no arquivo .env!\n"
            "Usando banco local SQLite temporário (./clinica_psico.db).\n"
            "Para conectar ao Supabase, configure a variável DATABASE_URL no .env com sua Connection String.\n"
        )

# Normalização de protocolo para garantir compatibilidade com SQLAlchemy 2.0 e psycopg2
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+psycopg2" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# Configuração de argumentos de conexão de acordo com o banco
connect_args = {}
engine_kwargs = {"pool_pre_ping": True}

if "postgresql" in DATABASE_URL or "postgres" in DATABASE_URL:
    # Supabase e provedores em nuvem (Render/Neon/AWS) exigem SSL
    default_ssl = "require" if ("supabase" in DATABASE_URL or "render.com" in DATABASE_URL) else "prefer"
    sslmode = os.getenv("DB_SSLMODE", default_ssl)
    if sslmode and sslmode.lower() not in ("none", "disable", "false"):
        connect_args["sslmode"] = sslmode
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE", "10"))
    engine_kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", "20"))
elif "sqlite" in DATABASE_URL:
    connect_args["check_same_thread"] = False
else:
    engine_kwargs["pool_recycle"] = 1800

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
