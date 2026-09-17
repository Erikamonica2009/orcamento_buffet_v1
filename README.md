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
2. Suba tudo: `docker compose up --build`
3. Rode a migration + seed (primeira vez, ou depois de um `down -v`): `docker compose exec backend npx prisma db seed`
4. Backend: http://localhost:3000 (rota de saúde em `/health`)
5. Frontend: http://localhost:5173
6. Login de administrador seedado: `admin@buffet.com` / `admin123`

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
