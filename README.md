# Orçamento Buffet

Sistema de orçamento de eventos para um buffet: o cliente se cadastra e
solicita um orçamento; um administrador analisa o pedido e responde com um
valor.

## Stack

- Backend: Node.js + Express + TypeScript + Prisma (PostgreSQL)
- Frontend: React + Vite + TypeScript + React Router + React Hook Form + Zod
- Orquestração: Docker Compose (Postgres + backend + frontend)

## Rodando o projeto

1. Copie os arquivos de ambiente: `cp .env.example .env` e `cp frontend/.env.example frontend/.env`
   - No `.env`, gere chaves próprias para `DATA_ENCRYPTION_KEY` e `DATA_HASH_KEY` (cada uma com
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) e troque
     `APP_DB_PASSWORD`. O backend não sobe com chaves inválidas ou iguais. Nunca commite o `.env`.
2. Suba tudo: `docker compose up --build`
3. Rode a migration + seed (primeira vez, ou depois de um `down -v`): `docker compose exec backend npx prisma db seed`
4. Backend: http://localhost:3000 (rota de saúde em `/health`)
5. Frontend: http://localhost:5173
6. Login de administrador seedado: `admin@buffet.com` / `Admin@123`

## Rotas do frontend

```
/login                    (seleção cliente/admin)
/cadastro                 (auto-cadastro de cliente)

# role=cliente
/meus-orcamentos          (lista + form de novo pedido de orçamento)

# role=admin
/admins                   (CRUD de administradores)
/clientes                 (listagem, somente leitura)
/tipos-evento             (CRUD com exclusão lógica)
/itens                    (CRUD com exclusão lógica, por categoria)
/orcamentos               (lista, filtro por status)
/orcamentos/:id           (detalhe → aprovar/recusar/definir valor)
```

## Os três pilares de segurança (backend)

- **Rate limiting** (`express-rate-limit`): 5/min/IP em `POST /auth/*/login`; 20/min/IP em `POST /clientes` e `POST /orcamentos`.
- **Tratamento de erro centralizado**: `AppError` + middleware único de erro — nunca vaza stack trace, sempre `{ error: "mensagem segura" }`.
- **Prevenção de SQL Injection**: todo acesso a dado passa pelo Prisma (queries parametrizadas); nenhuma camada concatena SQL a partir de input do usuário.

## Segurança no armazenamento (camada de dados)

- **Criptografia em repouso (AES-256-GCM)**: CPF e telefone são gravados cifrados na tabela
  `clientes` (`enc:v1:<iv>:<tag>:<dados>`). Quem copiar os arquivos/backup do Postgres leva só
  texto ilegível sem `DATA_ENCRYPTION_KEY`. A unicidade/busca por CPF usa um *blind index*
  (`cpf_hash` = HMAC-SHA256 com `DATA_HASH_KEY`). Código: `backend/src/utils/crypto.ts` e
  `backend/src/repositories/clientes.repository.ts`. Registros antigos em texto puro são
  cifrados automaticamente na subida (`backend/src/scripts/setupDatabase.ts`).
- **Hashing de senhas (bcrypt + salt)**: custo 12, centralizado em `backend/src/utils/password.ts`.
  Hashes antigos (custo 10) são refeitos de forma transparente no próximo login.
- **Princípio do menor privilégio**: o servidor conecta como `APP_DB_USER` (`buffet_app`), que só
  tem `SELECT/INSERT/UPDATE` nas tabelas do sistema (`DELETE` apenas em `admins`), sem DDL e sem
  acesso a `_prisma_migrations`. O dono do banco (`POSTGRES_USER`) é usado só para migrations e
  para criar/atualizar esse usuário (`DATABASE_URL_OWNER`).
- **Mascaramento de dados**: a API nunca devolve CPF/telefone completos na listagem de clientes —
  só os 4 últimos dígitos (`***.***.*12-34`, `(**) *****-1234`). Código:
  `backend/src/utils/dataMasking.ts`. O telefone completo aparece apenas no detalhe do
  orçamento, onde o admin precisa contatar o cliente.

Para conferir no banco (texto cifrado) e o usuário restrito:

```
docker compose exec db psql -U buffet -d orcamento_buffet -c "select id, cpf, telefone, cpf_hash from clientes"
docker compose exec db psql -U buffet_app -d orcamento_buffet -c "drop table clientes"   # → permission denied
```

## Hardening de segurança no frontend

- Validação de formulário com Zod + máscaras de CPF/telefone.
- CSP via meta tag em `index.html`.
- Sanitização de campos livres (`observacoes`) com DOMPurify antes de qualquer renderização.
- Logout automático por inatividade (15 min) e redirecionamento limpo em sessão expirada.
- Botão de submit desabilitado durante o envio; confirmação em ações destrutivas do admin.
- `ErrorBoundary` + páginas 404/erro customizadas, sem vazar detalhes internos.

## Testes

- Backend: `docker compose run --rm backend npm test` (Vitest + Supertest contra um banco de teste isolado).
- Frontend: `docker compose run --rm frontend npm test` (Vitest + React Testing Library).

## Documentação

- Spec de design: `docs/superpowers/specs/2026-09-13-orcamento-buffet-design.md`
- Planos de implementação: `docs/superpowers/plans/`
