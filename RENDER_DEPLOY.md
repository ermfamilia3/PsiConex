# 🚀 Guia de Deploy do PsiConex no Render

Este guia explica como colocar o **PsiConex** (Backend em **Python FastAPI** + Frontend em **React Vite**) no ar utilizando a plataforma **Render** ([render.com](https://render.com)).

---

## 🏗️ Arquitetura do Projeto

- **Backend (Python / FastAPI)**: Serviço Web hospedado no Render (`rootDir: backend`), executando com `uvicorn`.
- **Frontend (React / Vite)**: Site Estático (SPA) com CDN global no Render (`rootDir: frontend/Clinica-PSICO-React`), publicando a pasta `dist`.
- **Banco de Dados (PostgreSQL)**: Pode ser o **Supabase** (recomendado - plano gratuito permanente) ou o **Render PostgreSQL**.

---

## ⚡ Método 1: Deploy Automático via Blueprint (`render.yaml`)

O repositório já inclui o arquivo `render.yaml`. Com ele, o Render configura a API e o Frontend juntos automaticamente!

1. Acesse o [Dashboard do Render](https://dashboard.render.com/) e faça login (com sua conta do GitHub).
2. Clique no botão **New +** no canto superior direito e escolha **Blueprint**.
3. Conecte o repositório `ermfamilia3/PsiConex`.
4. O Render detectará automaticamente o arquivo `render.yaml` e listará os 2 serviços:
   - `psiconex-backend` (Web Service Python)
   - `psiconex-frontend` (Static Site)
5. Preencha a variável **`DATABASE_URL`**:
   - Insira sua Connection String do Supabase ou do PostgreSQL (ex: `postgresql+psycopg2://postgres:SENHA@db.SEU_PROJETO.supabase.co:5432/postgres`).
6. Clique em **Apply**. O Render fará o build e deploy dos dois serviços automaticamente!

---

## 🛠️ Método 2: Deploy Manual Passo a Passo

Caso prefira configurar os serviços individualmente pelo painel do Render:

### Passo 1: Criar o Serviço de Backend (API Python)

1. No Render Dashboard, clique em **New +** -> **Web Service**.
2. Conecte o repositório `ermfamilia3/PsiConex`.
3. Preencha as configurações:
   - **Name**: `psiconex-backend`
   - **Region**: Oregon (US West) ou Ohio (US East)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
4. Expanda a seção **Advanced** e adicione as **Environment Variables**:
   | Chave | Valor Exemplo / Instrução |
   |---|---|
   | `PYTHON_VERSION` | `3.11.9` |
   | `DATABASE_URL` | Sua URL do Supabase ou PostgreSQL |
   | `SECRET_KEY` | Uma chave secreta longa (ou clique em Generate) |
   | `ENCRYPTION_KEY` | Uma chave secreta para criptografia de prontuários |
   | `ADMIN_EMAIL` | `admin@clinicapsico.com.br` |
   | `FRONTEND_ORIGINS` | `*` (ou a URL do seu frontend quando criado) |
   | `DB_SSLMODE` | `require` |
5. Clique em **Create Web Service**.
6. Guarde a URL gerada (ex: `https://psiconex-backend.onrender.com`).

---

### Passo 2: Criar o Serviço de Frontend (React / Vite)

1. No Render Dashboard, clique em **New +** -> **Static Site**.
2. Conecte o mesmo repositório `ermfamilia3/PsiConex`.
3. Preencha as configurações:
   - **Name**: `psiconex-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend/Clinica-PSICO-React`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Na aba **Redirects / Rewrites**, adicione a regra para Single Page Application (SPA):
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Na seção **Environment Variables**, adicione:
   | Chave | Valor |
   |---|---|
   | `VITE_API_URL` | `https://psiconex-backend.onrender.com` (a URL gerada no Passo 1) |
6. Clique em **Create Static Site**.

---

## 🔐 Configuração do Banco de Dados (Supabase)

Para inicializar a estrutura das tabelas no seu banco PostgreSQL:
1. Abra o painel do seu projeto no [Supabase](https://supabase.com).
2. Vá em **SQL Editor** -> **New Query**.
3. Copie o conteúdo do arquivo `backend/Banco/schema_supabase.sql` e execute.
4. Isso criará todas as tabelas (usuários, psicólogos, pacientes, agenda, prontuários, financeiro, documentos, etc.) com índices e usuário administrador padrão.

---

## ✅ Verificação e Testes

- **Health check da API**: Acesse `https://psiconex-backend.onrender.com/health` e confirme o retorno `{"status": "ok"}`.
- **Documentação Swagger**: Acesse `https://psiconex-backend.onrender.com/docs`.
- **Acesso ao Sistema**: Acesse `https://psiconex-frontend.onrender.com` e faça login com as credenciais configuradas.
