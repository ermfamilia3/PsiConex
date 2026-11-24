"""
Clínica PSICO — Modelos SQLAlchemy
Tabelas dedicadas para cada módulo do sistema.
"""

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, func,
)
from sqlalchemy.orm import relationship

from database import Base


# ─────────────────────────────────────────────
# 1. USUÁRIOS
# ─────────────────────────────────────────────
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    senha = Column(String(255), nullable=False)
    papel = Column(
        String(20), nullable=False, default="psicologo",
        comment="admin | psicologo | secretaria",
    )
    ativo = Column(Boolean, nullable=False, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    pacientes = relationship("Paciente", back_populates="usuario", cascade="all, delete-orphan")
    psicologos = relationship("Psicologo", back_populates="usuario", cascade="all, delete-orphan")
    assinaturas = relationship("Assinatura", back_populates="usuario", cascade="all, delete-orphan")
    configuracoes = relationship("Configuracao", back_populates="usuario", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="usuario")


# ─────────────────────────────────────────────
# 2. PACIENTES (preserva existente + melhorias)
# ─────────────────────────────────────────────
class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    nome = Column(String(150), nullable=False, index=True)
    data_nascimento = Column(String(10), nullable=True)
    cpf = Column(String(14), nullable=True, index=True)
    email = Column(String(150), nullable=True)
    telefone = Column(String(30), nullable=True)
    endereco = Column(String(255), nullable=True)
    responsavel = Column(String(150), nullable=True)
    contato_emergencia = Column(String(150), nullable=True)
    telefone_emergencia = Column(String(30), nullable=True)
    modalidade = Column(String(30), nullable=False, default="Presencial")
    status = Column(String(20), nullable=False, default="Ativo")
    observacoes = Column(String(1000), nullable=True)
    consentimento_lgpd = Column(Boolean, nullable=False, default=False)
    data_consentimento = Column(DateTime(timezone=True), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    usuario = relationship("Usuario", back_populates="pacientes")
    agendamentos = relationship("Agendamento", back_populates="paciente", cascade="all, delete-orphan")
    prontuarios = relationship("Prontuario", back_populates="paciente", cascade="all, delete-orphan")
    transacoes = relationship("Transacao", back_populates="paciente")
    documentos = relationship("Documento", back_populates="paciente", cascade="all, delete-orphan")
    aplicacoes_testes = relationship("AplicacaoTeste", back_populates="paciente", cascade="all, delete-orphan")


# ─────────────────────────────────────────────
# 3. PSICÓLOGOS
# ─────────────────────────────────────────────
class Psicologo(Base):
    __tablename__ = "psicologos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    nome = Column(String(150), nullable=False)
    crp = Column(String(20), nullable=False)
    especialidade = Column(String(100), nullable=True)
    email = Column(String(150), nullable=True)
    telefone = Column(String(30), nullable=True)
    abordagem = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="Ativo")
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    usuario = relationship("Usuario", back_populates="psicologos")
    agendamentos = relationship("Agendamento", back_populates="psicologo")
    prontuarios = relationship("Prontuario", back_populates="psicologo")
    transacoes = relationship("Transacao", back_populates="psicologo")
    documentos = relationship("Documento", back_populates="psicologo")
    aplicacoes_testes = relationship("AplicacaoTeste", back_populates="psicologo")


# ─────────────────────────────────────────────
# 4. AGENDAMENTOS
# ─────────────────────────────────────────────
class Agendamento(Base):
    __tablename__ = "agendamentos"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True)
    psicologo_id = Column(Integer, ForeignKey("psicologos.id", ondelete="SET NULL"), nullable=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    data = Column(Date, nullable=False, index=True)
    hora_inicio = Column(String(5), nullable=False, comment="HH:MM")
    hora_fim = Column(String(5), nullable=True, comment="HH:MM")
    tipo = Column(String(60), nullable=False, default="Psicoterapia individual")
    modalidade = Column(String(30), nullable=False, default="Presencial")
    status = Column(String(30), nullable=False, default="Aguardando")
    link_sala = Column(String(500), nullable=True, comment="Link Jitsi Meet")
    observacoes = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    paciente = relationship("Paciente", back_populates="agendamentos")
    psicologo = relationship("Psicologo", back_populates="agendamentos")
    usuario = relationship("Usuario")


# ─────────────────────────────────────────────
# 5. PRONTUÁRIOS
# ─────────────────────────────────────────────
class Prontuario(Base):
    __tablename__ = "prontuarios"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True)
    psicologo_id = Column(Integer, ForeignKey("psicologos.id", ondelete="SET NULL"), nullable=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    data = Column(Date, nullable=False, index=True)
    tipo = Column(String(60), nullable=False, default="Evolução de sessão")
    evolucao = Column(Text, nullable=True, comment="Texto criptografado em produção")
    conduta = Column(Text, nullable=True)
    confidencial = Column(Boolean, nullable=False, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    paciente = relationship("Paciente", back_populates="prontuarios")
    psicologo = relationship("Psicologo", back_populates="prontuarios")
    usuario = relationship("Usuario")


# ─────────────────────────────────────────────
# 6. TRANSAÇÕES FINANCEIRAS
# ─────────────────────────────────────────────
class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="SET NULL"), nullable=True, index=True)
    psicologo_id = Column(Integer, ForeignKey("psicologos.id", ondelete="SET NULL"), nullable=True, index=True)
    descricao = Column(String(255), nullable=False)
    tipo = Column(String(20), nullable=False, comment="Receita | Despesa")
    categoria = Column(String(60), nullable=False, default="Atendimento")
    valor = Column(Float, nullable=False)
    data = Column(Date, nullable=False, index=True)
    status = Column(String(30), nullable=False, default="Pendente")
    forma_pagamento = Column(String(40), nullable=True)
    observacoes = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    usuario = relationship("Usuario")
    paciente = relationship("Paciente", back_populates="transacoes")
    psicologo = relationship("Psicologo", back_populates="transacoes")


# ─────────────────────────────────────────────
# 7. DOCUMENTOS
# ─────────────────────────────────────────────
class Documento(Base):
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True)
    psicologo_id = Column(Integer, ForeignKey("psicologos.id", ondelete="SET NULL"), nullable=True, index=True)
    tipo = Column(String(60), nullable=False, comment="Declaração | Relatório | Laudo | Encaminhamento | Recibo")
    titulo = Column(String(255), nullable=False)
    conteudo = Column(Text, nullable=True, comment="Corpo do documento")
    data = Column(Date, nullable=False)
    status = Column(String(30), nullable=False, default="Rascunho")
    arquivo_pdf = Column(String(500), nullable=True, comment="Caminho do PDF gerado")
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    usuario = relationship("Usuario")
    paciente = relationship("Paciente", back_populates="documentos")
    psicologo = relationship("Psicologo", back_populates="documentos")


# ─────────────────────────────────────────────
# 8. APLICAÇÕES DE TESTES PSICOLÓGICOS
# ─────────────────────────────────────────────
class AplicacaoTeste(Base):
    __tablename__ = "aplicacoes_testes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True)
    psicologo_id = Column(Integer, ForeignKey("psicologos.id", ondelete="SET NULL"), nullable=True, index=True)
    instrumento = Column(String(150), nullable=False)
    data_aplicacao = Column(Date, nullable=False)
    status = Column(String(30), nullable=False, default="Aplicado")
    resultado = Column(Text, nullable=True)
    observacoes = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    usuario = relationship("Usuario")
    paciente = relationship("Paciente", back_populates="aplicacoes_testes")
    psicologo = relationship("Psicologo", back_populates="aplicacoes_testes")


# ─────────────────────────────────────────────
# 9. ASSINATURAS / PLANOS
# ─────────────────────────────────────────────
class Assinatura(Base):
    __tablename__ = "assinaturas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    plano = Column(String(30), nullable=False, default="Basico")
    valor = Column(Float, nullable=False, default=69.0)
    inicio = Column(Date, nullable=False)
    fim = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="Ativo")
    mercadopago_id = Column(String(100), nullable=True, comment="ID da assinatura no MP")
    mercadopago_link = Column(String(500), nullable=True, comment="Link de pagamento")
    observacoes = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    usuario = relationship("Usuario", back_populates="assinaturas")


# ─────────────────────────────────────────────
# 10. AUDITORIA
# ─────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    acao = Column(String(30), nullable=False, comment="CRIAR | LER | ATUALIZAR | EXCLUIR")
    tabela = Column(String(60), nullable=False, index=True)
    registro_id = Column(Integer, nullable=True)
    dados_anteriores = Column(Text, nullable=True)
    dados_novos = Column(Text, nullable=True)
    ip = Column(String(45), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    usuario = relationship("Usuario", back_populates="audit_logs")


# ─────────────────────────────────────────────
# 11. CONFIGURAÇÕES
# ─────────────────────────────────────────────
class Configuracao(Base):
    __tablename__ = "configuracoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    chave = Column(String(60), nullable=False)
    valor = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    usuario = relationship("Usuario", back_populates="configuracoes")
