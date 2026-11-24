# 📘 MANUAL DE INSTALAÇÃO E IMPLANTAÇÃO — CLÍNICA PSICO v2.0

Este manual descreve o passo a passo para executar o sistema **Clínica PSICO v2.0** no ambiente de desenvolvimento local (usando **PyCharm** e **Node.js**) e também a implantação em **Servidor em Nuvem** (via Docker Compose).

---

## 📋 Requisitos do Sistema

- **Python**: versão 3.10 ou superior
- **Node.js**: versão 18 ou superior (com npm)
- **Banco de Dados**: MySQL 8.0 ou MariaDB 10.5+
- **IDE recomendada**: JetBrains PyCharm (Professional ou Community) ou VS Code
- **Navegador**: Google Chrome, Mozilla Firefox, Edge ou Safari atualizados

---

## 🚀 Método 1: Executando Localmente no PyCharm

### 1.1 Configurar o Banco de Dados MySQL
1. Abra o **MySQL Workbench** (ou terminal MySQL).
2. Conecte-se com sua conta de administrador (geralmente `root`).
3. Abra o arquivo `backend/Banco/schema.sql` e execute o script completo.
   - O script criará o banco de dados `clinica_psico` e todas as 11 tabelas dedicadas.
   - Também criará o usuário administrador inicial:
     - **E-mail**: `admin@clinicapsico.com.br`
     - **Senha**: `Admin@123`

### 1.2 Configurar o Backend no PyCharm
1. Abra o **PyCharm**.
2. Clique em **File > Open** e selecione a pasta `backend`.
3. Configure o interpretador Python:
   - Vá em **File > Settings > Project: backend > Python Interpreter**.
   - Adicione um novo interpretador Virtualenv (`.venv`).
4. Abra o Terminal integrado do PyCharm (**Alt + F12**):
   ```bash
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```
5. Configure o arquivo de variáveis de ambiente:
   - Copie `.env.example` para `.env` dentro da pasta `backend`:
   ```bash
   cp .env.example .env
   ```
   - Edite o arquivo `.env` preenchendo sua senha do MySQL:
   ```env
   DB_USER=root
   DB_PASSWORD=sua_senha_mysql_aqui
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=clinica_psico
   SECRET_KEY=sua_chave_jwt_secreta_e_longa_aqui
   ```
6. Inicie a API FastAPI:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   - A API estará disponível em: `http://127.0.0.1:8000`
   - A documentação Swagger interativa: `http://127.0.0.1:8000/docs`
   - O endpoint de status de saúde: `http://127.0.0.1:8000/health`

### 1.3 Executar o Frontend React
1. Abra um segundo terminal e navegue até a pasta `frontend/Clinica-PSICO-React`:
   ```bash
   cd frontend/Clinica-PSICO-React
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
4. Inicie o servidor Vite:
   ```bash
   npm run dev
   ```
5. Abra o navegador em: `http://localhost:5173`
6. Faça login com o usuário administrador inicial:
   - **E-mail**: `admin@clinicapsico.com.br`
   - **Senha**: `Admin@123`
   *(Você também pode clicar em "Criar conta" na tela de login para cadastrar novos psicólogos).*

---

## ☁️ Método 2: Implantação em Nuvem via Docker Compose

Para colocar o sistema online em uma VPS (AWS, DigitalOcean, Hetzner, Google Cloud, Azure, etc.):

1. Clone ou descompacte o projeto no servidor Linux.
2. Certifique-se de que o **Docker** e o **Docker Compose** estão instalados.
3. Configure as variáveis de produção no arquivo `docker-compose.yml` e no `.env`.
4. Execute o comando de inicialização unificada:
   ```bash
   docker-compose up -d --build
   ```
5. O Docker iniciará automaticamente:
   - **Container MySQL**: Porta `3306` com volume persistente `db_data`
   - **Container Backend FastAPI**: Porta `8000`
   - **Container Frontend React + Nginx**: Porta `80` (e `5173`)
6. Acesse o endereço IP ou domínio do seu servidor pelo navegador.

---

## 🔑 Configurações das Integrações Externas

### 1. Videochamada Integrada (Jitsi Meet)
- Já vem pré-configurada e totalmente integrada!
- Ao marcar qualquer agendamento com a modalidade **On-line**, o sistema gera automaticamente uma sala privada exclusiva com criptografia ponta a ponta.
- A tela **Atendimento On-line** embute a videoconferência diretamente na interface da plataforma e disponibiliza botão de 1 clique para copiar o link para o paciente.

### 2. Pagamentos e Assinaturas (Mercado Pago)
1. Acesse o painel de desenvolvedor do Mercado Pago: [https://www.mercadopago.com.br/developers](https://www.mercadopago.com.br/developers).
2. Crie uma aplicação e copie o **Access Token** de produção ou de testes (Sandbox).
3. Cole a chave no arquivo `backend/.env`:
   ```env
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu_token_aqui
   ```
4. O checkout gerará links de pagamento automáticos com PIX, Cartão e Boleto na página **Planos & Pagamentos**.

### 3. Emissão de Documentos e Laudos em PDF
- Utiliza a biblioteca profissional **ReportLab** integrada ao backend.
- A geração de Declarações, Relatórios Psicológicos, Laudos, Encaminhamentos e Recibos ocorre via API com cabeçalho formal, dados do paciente, carimbo de responsabilidade profissional e assinatura do psicólogo (com número de CRP).

---

## 🧪 Testes Automatizados

Para rodar os testes da suíte do backend:
```bash
pytest backend/tests/test_api.py -v
```

---

## 🛠️ Suporte & Solução de Dúvidas Frequentes

- **Erro de conexão com o banco**: Verifique se o serviço MySQL está ativo e se a senha no arquivo `.env` corresponde à do seu banco local.
- **Erro de CORS no navegador**: Certifique-se de que a variável `FRONTEND_ORIGINS` no `.env` do backend inclui a porta onde o frontend está rodando (ex: `http://localhost:5173`).
- **Recuperação de Acesso**: Caso esqueça a senha de um usuário, utilize o script `backend/Banco/schema.sql` para reinserir o usuário administrador.
