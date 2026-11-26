# 🏥 CLÍNICA PSICO v2.0 — Plataforma Integrada de Gestão Clínica & Psicológica

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1.svg?logo=mysql&logoColor=white)](https://www.mysql.com)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![LGPD](https://img.shields.io/badge/LGPD-Compliant-success.svg)](./LGPD.md)

A **Clínica PSICO v2.0** é um sistema completo e profissional desenvolvido para psicólogos autônomos, consultórios e clínicas multidisciplinares. O projeto integra todos os 10 módulos essenciais em uma arquitetura moderna, robusta e aderente às resoluções do Conselho Federal de Psicologia (CFP) e à Lei Geral de Proteção de Dados (LGPD).

---

## 🌟 Principais Funcionalidades

### 1. 👥 Gestão Completa de Pacientes
- Cadastro completo preservando o módulo existente e integrando aos demais.
- Busca inteligente por nome, CPF e telefone.
- Histórico clínico, contatos de emergência e modalidade de atendimento (Presencial, On-line, Híbrido).
- Termo de consentimento e conformidade LGPD.

### 2. 📅 Agenda & Calendário Interativo
- Visualização mensal em grade de calendário e lista cronológica.
- Agendamento de sessões com seleção de paciente, psicólogo, horário e tipo de intervenção.
- **Geração automática de sala de videochamada** para consultas marcadas como "On-line".

### 3. 📹 Atendimento On-line Integrado (Jitsi Meet)
- Videochamadas de telepsicologia que rodam **diretamente dentro do sistema**, sem necessidade de softwares externos.
- Conexão WebRTC com criptografia ponta a ponta e sem custos adicionais.
- Botão de 1 clique para copiar o link da sala e enviar para o paciente por WhatsApp ou e-mail.

### 4. 📝 Prontuários com Evolução Clínica
- Registro longitudinal de sessões, anamneses e condutas terapêuticas.
- **Criptografia AES-256** do conteúdo clínico sensível.
- Acesso restrito com registro obrigatório de auditoria a cada visualização.

### 5. 📄 Emissão de Documentos e Laudos em PDF
- Geração instantânea e download de:
  - **Declaração de Comparecimento**
  - **Relatório Psicológico**
  - **Laudo Psicológico**
  - **Encaminhamento Médico / Multidisciplinar**
  - **Recibo de Pagamento**
- Cabeçalho formal da clínica, carimbo de responsabilidade profissional e assinatura com CRP.

### 6. 💼 Gestão do Corpo Clínico (Psicólogos)
- Cadastro de profissionais com CRP, especialidade clínica e abordagem teórica (TCC, Psicanálise, Humanista, etc.).
- Vinculação de pacientes, sessões, documentos e prontuários a cada psicólogo.

### 7. 💰 Financeiro & Fluxo de Caixa
- Controle de receitas e despesas com categorização detalhada.
- Cálculo de saldo em caixa, receitas realizadas vs. pendentes.
- Suporte a múltiplas formas de pagamento (PIX, Cartão, Dinheiro, Boleto).

### 8. 💳 Planos & Cobrança (Mercado Pago)
- Planos **Básico (R$ 69/mês)** e **Premium (R$ 110/mês)** integrados ao checkout do Mercado Pago.
- Histórico completo de faturas e assinaturas.

### 9. 📊 Relatórios & Métricas Gerenciais
- Painel com taxa de realização de sessões, proporção de modalidades e faturamento mensal.

### 10. 🛡️ Segurança, Auditoria e LGPD
- Autenticação JWT com expiração segura e hash bcrypt.
- Controle de acesso por perfil (Admin, Psicólogo, Secretária).
- Trilha de auditoria completa com carimbo de tempo, IP e operador.

---

## 🗂️ Estrutura do Repositório

```
Clinica_PSICO_v2/
├── backend/                        # Backend Python FastAPI
│   ├── main.py                     # Ponto de entrada da API
│   ├── database.py                 # Conexão com MySQL (SQLAlchemy)
│   ├── models.py                   # 11 modelos relacionais dedicados
│   ├── schemas.py                  # Validações Pydantic v2
│   ├── requirements.txt            # Dependências Python
│   ├── .env.example                # Exemplo de configuração
│   ├── Dockerfile                  # Container do backend
│   ├── Banco/
│   │   └── schema.sql              # Script SQL de criação do banco
│   ├── routers/                    # Endpoints modularizados
│   │   ├── usuarios.py
│   │   ├── pacientes.py
│   │   ├── psicologos.py
│   │   ├── agenda.py
│   │   ├── prontuarios.py
│   │   ├── financeiro.py
│   │   ├── documentos.py
│   │   ├── testes.py
│   │   ├── planos.py
│   │   ├── auditoria.py
│   │   ├── relatorios.py
│   │   └── configuracoes.py
│   ├── services/                   # Regras de negócio e integrações
│   │   ├── usuario_service.py
│   │   ├── pdf_service.py          # Gerador profissional de PDF
│   │   ├── mercadopago_service.py  # Integração com Mercado Pago
│   │   └── email_service.py        # Notificações SMTP
│   ├── utils/                      # Segurança e utilidades
│   │   ├── auth.py
│   │   ├── rbac.py
│   │   ├── audit.py
│   │   └── crypto.py
│   └── tests/
│       └── test_api.py             # Testes automatizados (pytest)
├── frontend/Clinica-PSICO-React/   # Frontend React + Vite
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── Dockerfile                  # Container do frontend com Nginx
│   ├── nginx.conf
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 # Controlador mestre do frontend
│       ├── styles.css              # Estilos responsivos
│       ├── components/             # Componentes reutilizáveis
│       │   ├── Sidebar.jsx
│       │   ├── Header.jsx
│       │   ├── Modal.jsx
│       │   ├── LoginScreen.jsx
│       │   └── UI.jsx
│       ├── pages/                  # Telas completas
│       │   ├── Dashboard.jsx
│       │   ├── Pacientes.jsx
│       │   ├── Psicologos.jsx
│       │   ├── Agenda.jsx
│       │   ├── AtendimentoOnline.jsx
│       │   ├── Prontuarios.jsx
│       │   ├── Documentos.jsx
│       │   ├── Testes.jsx
│       │   ├── Financeiro.jsx
│       │   ├── Planos.jsx
│       │   ├── Relatorios.jsx
│       │   ├── Auditoria.jsx
│       │   └── Configuracoes.jsx
│       └── services/
│           └── api.js              # Cliente HTTP completo
├── docker-compose.yml              # Deploy automatizado completo
├── MANUAL_INSTALACAO.md            # Guia passo a passo de instalação
├── LGPD.md                         # Termos técnicos de conformidade LGPD
├── CHANGELOG.md                    # Histórico de versões
└── README.md                       # Este arquivo
```

---

## ⚡ Como Iniciar Rapidamente

- **Deploy em Nuvem (Render)**: Veja o guia completo em [`RENDER_DEPLOY.md`](./RENDER_DEPLOY.md) (Deploy automático via Blueprint ou manual).
- **Instalação Local**: Consulte o arquivo [`MANUAL_INSTALACAO.md`](./MANUAL_INSTALACAO.md) para o tutorial passo a passo de abertura no **PyCharm** ou implantação com **Docker Compose**.
- **Configuração do Supabase**: Consulte [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

### Credenciais Padrão do Administrador Inicial:
- **E-mail**: `admin@clinicapsico.com.br`
- **Senha**: `Admin@123`
*(Altere a senha após o primeiro acesso ou crie novos psicólogos diretamente pela tela de login).*
