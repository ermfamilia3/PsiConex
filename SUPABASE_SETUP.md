# 🧠 PsiConex — Guia de Configuração do Supabase (PostgreSQL)

Este guia descreve como conectar o backend do **PsiConex** ao banco de dados **PostgreSQL** gerenciado pelo [Supabase](https://supabase.com), substituindo o MySQL local.

---

## Pré-requisitos

- Conta criada em [supabase.com](https://supabase.com) (plano gratuito disponível)
- Python 3.11+ com `pip`
- Repositório clonado localmente

---

## Passo 1 — Criar o projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com) e clique em **New project**.
2. Escolha uma organização (ou crie uma nova).
3. Preencha:
   - **Name**: `psiconex` (ou o nome que preferir)
   - **Database Password**: crie uma senha forte e **guarde-a** — será usada na connection string.
   - **Region**: escolha a mais próxima do Brasil (ex: `South America (São Paulo)`).
4. Clique em **Create new project** e aguarde a inicialização (cerca de 1 minuto).

---

## Passo 2 — Obter a Connection String

1. No painel do projeto, vá em **Settings** (ícone de engrenagem) → **Database**.
2. Role até a seção **Connection string**.
3. Selecione a aba **URI**.
4. Copie a string. Ela terá o formato:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
5. Substitua `[YOUR-PASSWORD]` pela senha que você definiu no Passo 1.

---

## Passo 3 — Configurar o arquivo `.env`

1. Na pasta `backend/`, copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
2. Abra o `.env` e preencha a variável `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:SUA_SENHA@db.SEU_PROJECT_REF.supabase.co:5432/postgres
   ```
   > **Atenção**: use o prefixo `postgresql+psycopg2://` (não apenas `postgresql://`) para compatibilidade com o SQLAlchemy.

3. Preencha também as demais variáveis (`SECRET_KEY`, `ENCRYPTION_KEY`, etc.) conforme necessário.

---

## Passo 4 — Executar o schema no Supabase

1. No painel do Supabase, clique em **SQL Editor** (ícone de banco de dados com raios).
2. Clique em **New query**.
3. Abra o arquivo `backend/Banco/schema_supabase.sql` localmente, **copie todo o conteúdo** e cole na área de texto do SQL Editor.
4. Clique em **Run** (▶).
5. Verifique se as tabelas aparecem em **Table Editor** — devem estar listadas: `usuarios`, `pacientes`, `psicologos`, `agendamentos`, `prontuarios`, `transacoes`, `documentos`, `aplicacoes_testes`, `assinaturas`, `audit_log`, `configuracoes`.

> **Nota**: o usuário administrador padrão (`admin@clinicapsico.com.br` / senha `Admin@123`) é inserido automaticamente pelo script. Altere a senha no primeiro acesso.

---

## Passo 5 — Instalar as dependências Python

Na pasta `backend/`, instale os pacotes atualizados:

```bash
pip install -r requirements.txt
```

> O driver `psycopg2-binary` substitui o `PyMySQL` que era utilizado com o MySQL.

---

## Passo 6 — Iniciar o backend

```bash
cd backend
uvicorn main:app --reload
```

A API estará disponível em `http://localhost:8000`. Acesse a documentação interativa em `http://localhost:8000/docs`.

---

## Resumo das alterações realizadas

| Arquivo | O que mudou |
|---|---|
| `backend/Banco/schema_supabase.sql` | Novo schema PostgreSQL (criado) |
| `backend/database.py` | Adaptado para `DATABASE_URL` único + `psycopg2` + SSL |
| `backend/requirements.txt` | `PyMySQL` → `psycopg2-binary` |
| `backend/.env.example` | Variáveis individuais de DB → `DATABASE_URL` única |

---

## Dicas e Troubleshooting

- **Erro de SSL**: o Supabase exige conexão SSL. O `database.py` já inclui `sslmode=require`. Certifique-se de não remover essa configuração.
- **Senha com caracteres especiais**: se a senha contiver `@`, `#`, `%` etc., codifique-os em URL (ex: `%40` para `@`) ou coloque a string entre aspas no `.env`.
- **Quota gratuita**: o plano gratuito do Supabase permite até **500 MB** de banco de dados e **50.000 requisições/mês**. Suficiente para desenvolvimento e pequenas clínicas.
- **Backups**: o Supabase faz backup automático diário no plano gratuito (retenção de 1 dia) e com maior retenção nos planos pagos.
