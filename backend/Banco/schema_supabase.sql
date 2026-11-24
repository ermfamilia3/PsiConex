-- ============================================================================
-- CLÍNICA PSICO — Script de Estruturação do Banco de Dados PostgreSQL/Supabase
-- Versão: 2.0 Integrada (Migrado de MySQL → PostgreSQL)
-- ============================================================================

-- 1. Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    papel VARCHAR(20) NOT NULL DEFAULT 'psicologo',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    data_nascimento VARCHAR(10) NULL,
    cpf VARCHAR(14) NULL,
    email VARCHAR(150) NULL,
    telefone VARCHAR(30) NULL,
    endereco VARCHAR(255) NULL,
    responsavel VARCHAR(150) NULL,
    contato_emergencia VARCHAR(150) NULL,
    telefone_emergencia VARCHAR(30) NULL,
    modalidade VARCHAR(30) NOT NULL DEFAULT 'Presencial',
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    observacoes VARCHAR(1000) NULL,
    consentimento_lgpd BOOLEAN NOT NULL DEFAULT FALSE,
    data_consentimento TIMESTAMPTZ NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_pacientes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_pacientes_usuario ON pacientes (usuario_id);
CREATE INDEX idx_pacientes_nome ON pacientes (nome);
CREATE INDEX idx_pacientes_cpf ON pacientes (cpf);

-- 3. Psicólogos
CREATE TABLE IF NOT EXISTS psicologos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    crp VARCHAR(20) NOT NULL,
    especialidade VARCHAR(100) NULL,
    email VARCHAR(150) NULL,
    telefone VARCHAR(30) NULL,
    abordagem VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_psicologos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_psicologos_usuario ON psicologos (usuario_id);

-- 4. Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL,
    psicologo_id INT NULL,
    usuario_id INT NOT NULL,
    data DATE NOT NULL,
    hora_inicio VARCHAR(5) NOT NULL,
    hora_fim VARCHAR(5) NULL,
    tipo VARCHAR(60) NOT NULL DEFAULT 'Psicoterapia individual',
    modalidade VARCHAR(30) NOT NULL DEFAULT 'Presencial',
    status VARCHAR(30) NOT NULL DEFAULT 'Aguardando',
    link_sala VARCHAR(500) NULL,
    observacoes TEXT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_agendamentos_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_agendamentos_psicologo FOREIGN KEY (psicologo_id) REFERENCES psicologos(id) ON DELETE SET NULL,
    CONSTRAINT fk_agendamentos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_agendamentos_data ON agendamentos (data);
CREATE INDEX idx_agendamentos_paciente ON agendamentos (paciente_id);
CREATE INDEX idx_agendamentos_psicologo ON agendamentos (psicologo_id);

-- 5. Prontuários (com criptografia LGPD)
CREATE TABLE IF NOT EXISTS prontuarios (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL,
    psicologo_id INT NULL,
    usuario_id INT NOT NULL,
    data DATE NOT NULL,
    tipo VARCHAR(60) NOT NULL DEFAULT 'Evolução de sessão',
    evolucao TEXT NULL,
    conduta TEXT NULL,
    confidencial BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_prontuarios_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_prontuarios_psicologo FOREIGN KEY (psicologo_id) REFERENCES psicologos(id) ON DELETE SET NULL,
    CONSTRAINT fk_prontuarios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_prontuarios_data ON prontuarios (data);
CREATE INDEX idx_prontuarios_paciente ON prontuarios (paciente_id);

-- 6. Transações Financeiras (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS transacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    paciente_id INT NULL,
    psicologo_id INT NULL,
    descricao VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    categoria VARCHAR(60) NOT NULL DEFAULT 'Atendimento',
    valor NUMERIC(10,2) NOT NULL,
    data DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    forma_pagamento VARCHAR(40) NULL,
    observacoes TEXT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_transacoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_transacoes_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_transacoes_psicologo FOREIGN KEY (psicologo_id) REFERENCES psicologos(id) ON DELETE SET NULL
);

CREATE INDEX idx_transacoes_data ON transacoes (data);

-- 7. Documentos e Laudos
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    paciente_id INT NOT NULL,
    psicologo_id INT NULL,
    tipo VARCHAR(60) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NULL,
    data DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Rascunho',
    arquivo_pdf VARCHAR(500) NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_documentos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_documentos_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_documentos_psicologo FOREIGN KEY (psicologo_id) REFERENCES psicologos(id) ON DELETE SET NULL
);

-- 8. Testes Psicológicos
CREATE TABLE IF NOT EXISTS aplicacoes_testes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    paciente_id INT NOT NULL,
    psicologo_id INT NULL,
    instrumento VARCHAR(150) NOT NULL,
    data_aplicacao DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Aplicado',
    resultado TEXT NULL,
    observacoes TEXT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_testes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_testes_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_testes_psicologo FOREIGN KEY (psicologo_id) REFERENCES psicologos(id) ON DELETE SET NULL
);

-- 9. Assinaturas e Planos (Mercado Pago)
CREATE TABLE IF NOT EXISTS assinaturas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    plano VARCHAR(30) NOT NULL DEFAULT 'Basico',
    valor NUMERIC(10,2) NOT NULL DEFAULT 69.00,
    inicio DATE NOT NULL,
    fim DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    mercadopago_id VARCHAR(100) NULL,
    mercadopago_link VARCHAR(500) NULL,
    observacoes TEXT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_assinaturas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 10. Auditoria e Rastreabilidade (LGPD)
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    usuario_id INT NULL,
    acao VARCHAR(30) NOT NULL,
    tabela VARCHAR(60) NOT NULL,
    registro_id INT NULL,
    dados_anteriores TEXT NULL,
    dados_novos TEXT NULL,
    ip VARCHAR(45) NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_timestamp ON audit_log (timestamp);
CREATE INDEX idx_audit_tabela ON audit_log (tabela);

-- 11. Configurações da Clínica
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    chave VARCHAR(60) NOT NULL,
    valor TEXT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_config_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================================================
-- Usuário Administrador Inicial de Exemplo
-- Senha padrão: Admin@123 (hash bcrypt)
-- ============================================================================
INSERT INTO usuarios (id, nome, email, senha, papel, ativo)
VALUES (1, 'Administrador Clínica', 'admin@clinicapsico.com.br', '$2b$12$BXGitsQarOPTI1G3u.3xU.0jWAeJFMxI8UBKK1UTT.5Syccj5gIRi', 'admin', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Função e Triggers para atualização automática de atualizado_em
-- ============================================================================
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_pacientes_atualizado_em
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_psicologos_atualizado_em
  BEFORE UPDATE ON psicologos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_agendamentos_atualizado_em
  BEFORE UPDATE ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_prontuarios_atualizado_em
  BEFORE UPDATE ON prontuarios
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_transacoes_atualizado_em
  BEFORE UPDATE ON transacoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_documentos_atualizado_em
  BEFORE UPDATE ON documentos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_aplicacoes_testes_atualizado_em
  BEFORE UPDATE ON aplicacoes_testes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_assinaturas_atualizado_em
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_configuracoes_atualizado_em
  BEFORE UPDATE ON configuracoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
