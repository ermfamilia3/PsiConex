"""
Clínica PSICO — Schemas Pydantic
Validação e serialização de dados para todas as APIs.
"""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ─────────────────────────────────────────────
# USUARIO
# ─────────────────────────────────────────────
class UsuarioCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=64)
    papel: str = Field(default="psicologo", pattern="^(admin|psicologo|secretaria)$")


class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str


class UsuarioUpdate(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    email: EmailStr


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr
    papel: str
    ativo: bool
    is_admin_principal: bool = False

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# PACIENTE
# ─────────────────────────────────────────────
class PacienteBase(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    data_nascimento: str | None = None
    cpf: str | None = Field(default=None, max_length=14)
    email: EmailStr | None = None
    telefone: str | None = Field(default=None, max_length=30)
    endereco: str | None = Field(default=None, max_length=255)
    responsavel: str | None = Field(default=None, max_length=150)
    contato_emergencia: str | None = Field(default=None, max_length=150)
    telefone_emergencia: str | None = Field(default=None, max_length=30)
    modalidade: str = Field(default="Presencial", max_length=30)
    status: str = Field(default="Ativo", max_length=20)
    observacoes: str | None = Field(default=None, max_length=1000)
    consentimento_lgpd: bool = False


class PacienteCreate(PacienteBase):
    pass


class PacienteUpdate(PacienteBase):
    pass


class PacienteResponse(PacienteBase):
    id: int
    usuario_id: int
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# PSICÓLOGO
# ─────────────────────────────────────────────
class PsicologoBase(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    crp: str = Field(min_length=4, max_length=20)
    especialidade: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=150)
    telefone: str | None = Field(default=None, max_length=30)
    abordagem: str | None = Field(default=None, max_length=100)
    status: str = Field(default="Ativo", max_length=20)


class PsicologoCreate(PsicologoBase):
    senha: str | None = Field(default=None, max_length=64)


class PsicologoUpdate(PsicologoBase):
    pass


class PsicologoResponse(PsicologoBase):
    id: int
    usuario_id: int
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# AGENDAMENTO
# ─────────────────────────────────────────────
class AgendamentoBase(BaseModel):
    paciente_id: int
    psicologo_id: int | None = None
    data: date
    hora_inicio: str = Field(max_length=5, pattern=r"^\d{2}:\d{2}$")
    hora_fim: str | None = Field(default=None, max_length=5)
    tipo: str = Field(default="Psicoterapia individual", max_length=60)
    modalidade: str = Field(default="Presencial", max_length=30)
    status: str = Field(default="Aguardando", max_length=30)
    link_sala: str | None = Field(default=None, max_length=500)
    observacoes: str | None = None


class AgendamentoCreate(AgendamentoBase):
    pass


class AgendamentoUpdate(AgendamentoBase):
    pass


class AgendamentoResponse(AgendamentoBase):
    id: int
    usuario_id: int
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None

    # Nomes resolvidos (preenchidos no router)
    paciente_nome: str | None = None
    psicologo_nome: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# PRONTUÁRIO
# ─────────────────────────────────────────────
class ProntuarioBase(BaseModel):
    paciente_id: int
    psicologo_id: int | None = None
    data: date
    tipo: str = Field(default="Evolução de sessão", max_length=60)
    evolucao: str | None = None
    conduta: str | None = None
    confidencial: bool = True


class ProntuarioCreate(ProntuarioBase):
    pass


class ProntuarioUpdate(ProntuarioBase):
    pass


class ProntuarioResponse(ProntuarioBase):
    id: int
    usuario_id: int
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None
    paciente_nome: str | None = None
    psicologo_nome: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# TRANSAÇÃO FINANCEIRA
# ─────────────────────────────────────────────
class TransacaoBase(BaseModel):
    descricao: str = Field(min_length=2, max_length=255)
    tipo: str = Field(max_length=20, pattern="^(Receita|Despesa)$")
    categoria: str = Field(default="Atendimento", max_length=60)
    valor: float = Field(gt=0)
    data: date
    status: str = Field(default="Pendente", max_length=30)
    forma_pagamento: str | None = Field(default=None, max_length=40)
    paciente_id: int | None = None
    psicologo_id: int | None = None
    observacoes: str | None = None


class TransacaoCreate(TransacaoBase):
    pass


class TransacaoUpdate(TransacaoBase):
    pass


class TransacaoResponse(TransacaoBase):
    id: int
    usuario_id: int
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None
    paciente_nome: str | None = None
    psicologo_nome: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# DOCUMENTO
# ─────────────────────────────────────────────
class DocumentoBase(BaseModel):
    paciente_id: int
    psicologo_id: int | None = None
    tipo: str = Field(max_length=60)
    titulo: str = Field(min_length=2, max_length=255)
    conteudo: str | None = None
    data: date
    status: str = Field(default="Rascunho", max_length=30)


class DocumentoCreate(DocumentoBase):
    pass


class DocumentoUpdate(DocumentoBase):
    pass


class DocumentoResponse(DocumentoBase):
    id: int
    usuario_id: int
    arquivo_pdf: str | None = None
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None
    paciente_nome: str | None = None
    psicologo_nome: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# APLICAÇÃO DE TESTES
# ─────────────────────────────────────────────
class AplicacaoTesteBase(BaseModel):
    paciente_id: int
    psicologo_id: int | None = None
    instrumento: str = Field(min_length=2, max_length=150)
    data_aplicacao: date
    status: str = Field(default="Aplicado", max_length=30)
    resultado: str | None = None
    observacoes: str | None = None


class AplicacaoTesteCreate(AplicacaoTesteBase):
    pass


class AplicacaoTesteUpdate(AplicacaoTesteBase):
    pass


class AplicacaoTesteResponse(AplicacaoTesteBase):
    id: int
    usuario_id: int
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None
    paciente_nome: str | None = None
    psicologo_nome: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# ASSINATURA / PLANO
# ─────────────────────────────────────────────
class AssinaturaBase(BaseModel):
    plano: str = Field(default="Basico", max_length=30)
    valor: float = Field(default=69.0, gt=0)
    inicio: date
    fim: date | None = None
    status: str = Field(default="Ativo", max_length=20)
    observacoes: str | None = None


class AssinaturaCreate(AssinaturaBase):
    pass


class AssinaturaUpdate(BaseModel):
    plano: str | None = None
    status: str | None = None
    fim: date | None = None
    observacoes: str | None = None


class AssinaturaResponse(AssinaturaBase):
    id: int
    usuario_id: int
    mercadopago_id: str | None = None
    mercadopago_link: str | None = None
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# AUDITORIA
# ─────────────────────────────────────────────
class AuditLogResponse(BaseModel):
    id: int
    usuario_id: int | None = None
    acao: str
    tabela: str
    registro_id: int | None = None
    dados_anteriores: str | None = None
    dados_novos: str | None = None
    ip: str | None = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# CONFIGURAÇÃO
# ─────────────────────────────────────────────
class ConfiguracaoBase(BaseModel):
    chave: str = Field(min_length=1, max_length=60)
    valor: str | None = None


class ConfiguracaoCreate(ConfiguracaoBase):
    pass


class ConfiguracaoResponse(ConfiguracaoBase):
    id: int
    usuario_id: int

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# RELATÓRIOS
# ─────────────────────────────────────────────
class RelatorioResumo(BaseModel):
    total_pacientes: int = 0
    pacientes_ativos: int = 0
    total_agendamentos_mes: int = 0
    agendamentos_hoje: int = 0
    total_receitas_mes: float = 0.0
    total_despesas_mes: float = 0.0
    saldo_mes: float = 0.0
    total_prontuarios: int = 0
    total_documentos: int = 0
