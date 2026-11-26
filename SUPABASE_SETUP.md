# 🧠 PsiConex — Guia Completo: Supabase (PostgreSQL) & Controle de Acesso

Este guia descreve como conectar o **PsiConex** ao banco de dados **PostgreSQL** gerenciado pelo [Supabase](https://supabase.com) e como funciona a regra de permissão onde **apenas o Administrador Principal pode cadastrar novos psicólogos**.

---

## 🔐 Regra de Acesso: Apenas o Administrador Principal Cadastra Psicólogos

Por questões de segurança, conformidade e integridade dos registros da clínica:

- **Quem é o Administrador Principal:**
  - O usuário com perfil `admin` cujo e-mail corresponde a `ADMIN_EMAIL` no arquivo `.env` (padrão: `admin@clinicapsico.com.br`) ou que possua `id = 1` no banco de dados.
- **O que apenas o Administrador Principal pode fazer:**
  - ✅ Cadastrar novos psicólogos (criando automaticamente o login de acesso profissional).
  - ✅ Editar especialidades, CRP, abordagem e status de qualquer profissional.
  - ✅ Desativar ou excluir psicólogos do sistema.
  - ✅ Cadastrar novos administradores secundários ou secretárias.
- **O que os Psicólogos e outros usuários veem:**
  - 👁️ Visualização em modo leitura de seus dados e da equipe.
  - 🔒 O botão **"Novo psicólogo"** e os botões de edição/exclusão ficam bloqueados na interface.
  - 🚫 Tentativas diretas na API via HTTP POST/PUT/DELETE em `/psicologos/` retornam erro `403 Forbidden` (`Apenas o administrador principal pode cadastrar novos psicólogos`).

---

## Passo 1 — Criar o Projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com) e faça login (ou crie uma conta gratuita).
2. Clique em **New project**.
3. Escolha sua organização e preencha:
   - **Name**: `psiconex` (ou o nome da sua clínica)
   - **Database Password**: crie uma senha segura e **guarde-a** com cuidado.
   - **Region**: selecione `South America (São Paulo)` para menor latência.
4. Clique em **Create new project** e aguarde cerca de 1 minuto até o provisionamento concluir.

---

## Passo 2 — Obter a Connection String

1. No painel do seu projeto no Supabase, clique no ícone de engrenagem no menu lateral: **Project Settings** → **Database**.
2. Role até a seção **Connection string**.
3. Selecione a aba **URI**.
4. Copie a URL. Ela terá o formato:
   ```text
   postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJECT-REF].supabase.co:5432/postgres
   ```
   *(Caso utilize o Connection Pooling do Supabase, o formato será na porta `6543` ou `5432` pelo pooler).*
5. Substitua `[SUA-SENHA]` pela senha definida no Passo 1.
   > **Dica**: Se sua senha contiver caracteres especiais (como `@`, `#`, `%`, `&`), converta-os para URL Encoding (exemplo: `@` vira `%40`).

---

## Passo 3 — Executar o Schema no Supabase SQL Editor

1. No painel do Supabase, clique em **SQL Editor** (ícone com raios no menu lateral esquerdo).
2. Clique em **New query**.
3. Abra o arquivo local [`backend/Banco/schema_supabase.sql`](file:///d:/home/gabriel_25308.LAB/Downloads/PsiConex/PsiConex/backend/Banco/schema_supabase.sql).
4. Copie **todo o conteúdo** e cole no editor do Supabase.
5. Clique no botão **Run** (▶) ou pressione `Ctrl + Enter`.
6. O Supabase criará automaticamente todas as 11 tabelas:
   - `usuarios`
   - `pacientes`
   - `psicologos`
   - `agendamentos`
   - `prontuarios`
   - `transacoes`
   - `documentos`
   - `aplicacoes_testes`
   - `assinaturas`
   - `audit_log`
   - `configuracoes`
7. Vá em **Table Editor** e confirme se todas as tabelas e o usuário administrador padrão foram criados.

---

## Passo 4 — Configurar o Arquivo `.env` do Backend

Abra o arquivo [`backend/.env`](file:///d:/home/gabriel_25308.LAB/Downloads/PsiConex/PsiConex/backend/.env) e configure a sua URL do Supabase e o e-mail do Administrador Principal:

```env
# Banco de Dados — Supabase PostgreSQL
DATABASE_URL=postgresql+psycopg2://postgres:SUA_SENHA_AQUI@db.SEU_PROJETO_REF.supabase.co:5432/postgres

# Administrador Principal com permissão exclusiva de cadastro de psicólogos
ADMIN_EMAIL=admin@clinicapsico.com.br

# Chaves de Criptografia & JWT
SECRET_KEY=Pt0G7IPTR0E8P7lKD2s7Ad72WAIFo2n5lkKGRbY2kOY
ENCRYPTION_KEY=chave_aes_256_fernet_32_bytes_base64_aqui_________________

# Origens autorizadas do Frontend (CORS)
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

> **Nota de Compatibilidade**: O sistema normaliza automaticamente URLs iniciadas por `postgres://` ou `postgresql://` para `postgresql+psycopg2://`, garantindo funcionamento plug-and-play.

---

## Passo 5 — Instalar as Dependências e Rodar o Sistema

### 1. Backend (Python + FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- API disponível em: `http://localhost:8000`
- Documentação interativa Swagger: `http://localhost:8000/docs`

### 2. Frontend (React + Vite)
```bash
cd frontend/Clinica-PSICO-React
npm install
npm run dev
```
- Interface disponível em: `http://localhost:5173`

---

## Credenciais Iniciais do Administrador Principal

- **E-mail**: `admin@clinicapsico.com.br`
- **Senha**: `Admin@123`

Ao fazer login com esta conta, você terá acesso completo para cadastrar os psicólogos da clínica na aba **Psicólogos**. Cada profissional cadastrado receberá automaticamente seu login e senha individual para acessar prontuários e atendimentos online.
