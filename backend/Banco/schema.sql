-- ============================================================================
-- CLÍNICA PSICO — Script de Estruturação do Banco de Dados MySQL
-- Versão: 2.0 Integrada
-- ============================================================================

CREATE DATABASE IF NOT EXISTS clinica_psico
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clinica_psico;

-- 1. Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    papel VARCHAR(20) NOT NULL DEFAULT 'psicologo' COMMENT 'admin | psicologo | secretaria',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    data_consentimento DATETIME NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_pacientes_usuario (usuario_id),
    INDEX idx_pacientes_nome (nome),
    INDEX idx_pacientes_cpf (cpf),
    CONSTRAINT fk_pacientes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Psicólogos
CREATE TABLE IF NOT EXISTS psicologos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    crp VARCHAR(20) NOT NULL,
    especialidade VARCHAR(100) NULL,
    email VARCHAR(150) NULL,
    telefone VARCHAR(30) NULL,
    abordagem VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_psicologos_usuario (usuario_id),
    CONSTRAINT fk_psicologos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    psicologo_id INT NULL,
    usuario_id INT NOT NULL,
    data DATE NOT NULL,
    hora_inicio VARCHAR(5) NOT NULL COMMENT 'HH:MM',
    hora_fim VARCHAR(5) NULL COMMENT 'HH:MM',
    tipo VARCHAR(60) NOT NULL DEFAULT 'Psicoterapia individual',
    modalidade VARCHAR(30) NOT NULL DEFAULT 'Presencial',
    status VARCHAR(30) NOT NULL DEFAULT 'Aguardando',
    link_sala VARCHAR(500) NULL COMMENT 'Sala Jitsi Meet integrada',
    observacoes TEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_agendamentos_data (data),
    INDEX idx_agendamentos_paciente (paciente_id),
    INDEX idx_agendamentos_psicologo (psicologo_id),
    CONSTRAINT fk_agendamentos_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_agendamentos_psicologo FOREIGN KEY (psicologo_id) REFERENCES psicologos(id) ON DELETE SET NULL,
    CONSTRAINT fk_agendamentos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Prontuários (com criptografia LGPD)
CREATE TABLE IF NOT EXISTS prontuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    psicologo_id INT NULL,
    usuario_id INT NOT NULL,
    data DATE NOT NULL,
    tipo VARCHAR(60) NOT NULL DEFAULT 'Evolução de sessão',
    evolucao TEXT NULL COMMENT 'Texto cifrado AES-256',
    conduta TEXT NULL,
    confidencial BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_prontuarios_data (data),
    INDEX idx_prontuarios_paciente (paciente_id),
    CONSTRAINT fk_prontuarios_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_prontuarios_psicologo FOREIGN KEY (psicologo_id) REFERENCES psicologos(id) ON DELETE SET NULL,
    CONSTRAINT fk_prontuarios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Transações Financeiras (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS transacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    paciente_id INT NULL,
    psicologo_id INT NULL,
    descricao VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL COMMENT 'Receita | Despesa',
    categoria VARCHAR(60) NOT NULL DEFAULT 'Atendimento',
    valor FLOAT NOT NULL,
    data DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    forma_pagamento VARCHAR(40) NULL,
    observacoes TEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_transacoes_data (data),
    CONSTRAINT fk_transacoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_transacoes_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_transacoes_psicologo FOREIGN KEY (psicologo_id) REFERENCES psicologos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Documentos e Laudos
CREATE TABLE IF NOT EXISTS documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    paciente_id INT NOT NULL,
    psicologo_id INT NULL,
    tipo VARCHAR(60) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NULL,
    data DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Rascunho',
    arquivo_pdf VARCHAR(500) NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_documentos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_documentos_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_documentos_psicologo FOREIGN KEY (psicologo_id) REFERENCES psicologos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Testes Psicológicos
CREATE TABLE IF NOT EXISTS aplicacoes_testes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    paciente_id INT NOT NULL,
    psicologo_id INT NULL,
    instrumento VARCHAR(150) NOT NULL,
    data_aplicacao DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Aplicado',
    resultado TEXT NULL,
    observacoes TEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_testes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_testes_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_testes_psicologo FOREIGN KEY (psicologo_id) REFERENCES psicologos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Assinaturas e Planos (Mercado Pago)
CREATE TABLE IF NOT EXISTS assinaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    plano VARCHAR(30) NOT NULL DEFAULT 'Basico',
    valor FLOAT NOT NULL DEFAULT 69.00,
    inicio DATE NOT NULL,
    fim DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    mercadopago_id VARCHAR(100) NULL,
    mercadopago_link VARCHAR(500) NULL,
    observacoes TEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_assinaturas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Auditoria e Rastreabilidade (LGPD)
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    acao VARCHAR(30) NOT NULL COMMENT 'CRIAR | LER | ATUALIZAR | EXCLUIR | GERAR_PDF | LOGIN',
    tabela VARCHAR(60) NOT NULL,
    registro_id INT NULL,
    dados_anteriores TEXT NULL,
    dados_novos TEXT NULL,
    ip VARCHAR(45) NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_tabela (tabela),
    CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Configurações da Clínica
CREATE TABLE IF NOT EXISTS configuracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    chave VARCHAR(60) NOT NULL,
    valor TEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_config_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuário Administrador Inicial de Exemplo
-- Senha padrão: Admin@123 (hash bcrypt)
INSERT IGNORE INTO usuarios (id, nome, email, senha, papel, ativo)
VALUES (1, 'Administrador Clínica', 'admin@clinicapsico.com.br', '$2b$12$BXGitsQarOPTI1G3u.3xU.0jWAeJFMxI8UBKK1UTT.5Syccj5gIRi', 'admin', TRUE);
