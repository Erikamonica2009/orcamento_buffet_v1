# Orçamento Buffet

Sistema de orçamento de eventos para um buffet: o cliente se cadastra e
solicita um orçamento; um administrador analisa o pedido e responde com um
valor.

## Stack

- Backend: Node.js + Express + TypeScript + Prisma (PostgreSQL)
- Frontend: React + Vite + TypeScript
- Orquestração: Docker Compose (Postgres + backend + frontend)

## Rodando o projeto

1. Copie o arquivo de ambiente: `cp .env.example .env`
2. Suba tudo: `docker compose up --build`
3. Backend: http://localhost:3000 (rota de saúde em `/health`)
4. Frontend: http://localhost:5173

## Documentação

- Spec de design: `docs/superpowers/specs/2026-09-13-orcamento-buffet-design.md`
- Planos de implementação: `docs/superpowers/plans/`
