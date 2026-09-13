# Docker Infra Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Docker Compose skeleton (Postgres + a minimal backend + a minimal frontend) so the backend and frontend implementation plans that follow have a working container, a database, and a health-check contract to build against from day one.

**Architecture:** Three Docker Compose services — `db` (Postgres), `backend` (Node/Express/TS skeleton with a `/health` route), `frontend` (React/Vite/TS skeleton) — on one internal bridge network. Only `backend` and `frontend` publish ports to the host; `db` stays internal. The backend and frontend apps built here are intentionally minimal placeholders: the Backend and Frontend plans replace their internals but keep the same file layout, ports, and `/health` contract this plan establishes.

**Tech Stack:** Docker, Docker Compose, PostgreSQL 16 (alpine), Node.js 20 (alpine), Express, TypeScript, React 18, Vite.

**Spec:** `docs/superpowers/specs/2026-09-13-orcamento-buffet-design.md`

## Global Constraints

- Database image: `postgres:16-alpine` (per spec "Docker / orquestração").
- Backend stack: Node.js + Express + TypeScript (per spec "Arquitetura geral").
- Frontend stack: React + Vite + TypeScript (per spec "Arquitetura geral").
- Compose network: single internal network (`orcamento_net`); only `frontend` and `backend` expose ports to the host, `db` does not (per spec "Docker / orquestração").
- Secrets/config live in `.env` files, never committed — `.gitignore` already excludes `.env` and `.env.*` but keeps `!.env.example` (already committed in the repo root).
- All commands below assume the working directory is the project root: `orcamento_buffet/`.

---

### Task 1: Root environment scaffolding + Postgres service

**Files:**
- Create: `.env.example`
- Create: `.env`
- Create: `docker-compose.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: environment variables `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `BACKEND_PORT`, `FRONTEND_PORT` — every later task and plan reads these from the root `.env`. Produces the `orcamento_net` Docker network name and the `db` service name, which `backend`'s `depends_on` will reference in Task 2.

- [ ] **Step 1: Create `.env.example`**

```
# Postgres
POSTGRES_USER=buffet
POSTGRES_PASSWORD=buffet_dev_password
POSTGRES_DB=orcamento_buffet
POSTGRES_PORT=5432

# Backend
BACKEND_PORT=3000

# Frontend
FRONTEND_PORT=5173
```

- [ ] **Step 2: Copy it to a real `.env`**

Run: `cp .env.example .env` (or, on PowerShell: `Copy-Item .env.example .env`)

Expected: a `.env` file exists at the project root with the same content as `.env.example`. This file is already excluded from git by the existing `.gitignore`.

- [ ] **Step 3: Create `docker-compose.yml` with only the `db` service**

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - orcamento_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

networks:
  orcamento_net:
    driver: bridge

volumes:
  pgdata:
```

- [ ] **Step 4: Start the `db` service and verify it becomes healthy**

Run: `docker compose up -d db`
Then run: `docker compose ps`
Expected: the `db` row shows `STATUS` as `Up ... (healthy)` (wait a few seconds and re-run `docker compose ps` if it still says `starting`).

- [ ] **Step 5: Tear it down (keep the volume) before moving on**

Run: `docker compose down`
Expected: exits cleanly; running `docker volume ls` still shows a volume named `orcamento_buffet_pgdata` (or similar, prefixed by the project folder name).

- [ ] **Step 6: Create root `README.md` (start of the doc, expanded by later plans)**

```markdown
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
```

- [ ] **Step 7: Commit**

```bash
git add .env.example docker-compose.yml README.md
git commit -m "chore: bootstrap docker-compose with postgres service"
```

---

### Task 2: Minimal backend skeleton wired into Compose

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/main.ts`
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Create: `backend/.env.example`
- Modify: `docker-compose.yml`

**Interfaces:**
- Consumes: `POSTGRES_*`, `BACKEND_PORT` env vars and the `orcamento_net` network from Task 1; `db` service name for `depends_on`.
- Produces: `GET /health` on `BACKEND_PORT` returning `{"status":"ok"}` — the Backend plan builds its real routes alongside this file layout (`backend/src/main.ts` becomes the Express app entrypoint that mounts routers) and must keep `/health` working.

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "orcamento-buffet-backend",
  "version": "0.1.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/main.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/main.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.10",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.5.3"
  }
}
```

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `backend/src/main.ts`**

```ts
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`backend listening on port ${port}`);
});
```

- [ ] **Step 4: Create `backend/.dockerignore`**

```
node_modules
dist
.env
```

- [ ] **Step 5: Create `backend/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

- [ ] **Step 6: Create `backend/.env.example`**

```
PORT=3000
```

- [ ] **Step 7: Add the `backend` service to `docker-compose.yml`**

Modify `docker-compose.yml`: add this service under `services:`, alongside `db`, and keep the existing `networks:`/`volumes:` blocks unchanged:

```yaml
  backend:
    build:
      context: ./backend
    restart: unless-stopped
    environment:
      PORT: ${BACKEND_PORT}
    ports:
      - "${BACKEND_PORT}:${BACKEND_PORT}"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - orcamento_net
```

- [ ] **Step 8: Build and start `backend` and verify the health route**

Run: `docker compose up -d --build backend`
Then run: `curl http://localhost:3000/health`
Expected: `{"status":"ok"}`

- [ ] **Step 9: Commit**

```bash
git add backend docker-compose.yml
git commit -m "chore: add minimal backend skeleton with health route"
```

---

### Task 3: Minimal frontend skeleton wired into Compose

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/Dockerfile`
- Create: `frontend/.dockerignore`
- Modify: `docker-compose.yml`

**Interfaces:**
- Consumes: `FRONTEND_PORT` env var and `orcamento_net` network from Task 1; the `backend` service from Task 2 (for `depends_on` — no HTTP calls yet, those come in the Frontend plan).
- Produces: an HTTP server on `FRONTEND_PORT` serving the page whose `<title>` is `Orçamento Buffet` — the Frontend plan replaces `App.tsx`'s content with the real router/pages but keeps this file layout and the Vite config's `host`/`port` settings.

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "orcamento-buffet-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0 --port 5173"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.3.4"
  }
}
```

- [ ] **Step 2: Create `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `frontend/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
});
```

- [ ] **Step 4: Create `frontend/index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Orçamento Buffet</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `frontend/src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Create `frontend/src/App.tsx`**

```tsx
function App() {
  return (
    <main>
      <h1>Orçamento Buffet</h1>
      <p>Ambiente de infraestrutura no ar.</p>
    </main>
  );
}

export default App;
```

- [ ] **Step 7: Create `frontend/.dockerignore`**

```
node_modules
dist
.env
```

- [ ] **Step 8: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/vite.config.ts ./vite.config.ts
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

- [ ] **Step 9: Add the `frontend` service to `docker-compose.yml`**

Modify `docker-compose.yml`: add this service under `services:`, alongside `db` and `backend`:

```yaml
  frontend:
    build:
      context: ./frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT}:${FRONTEND_PORT}"
    depends_on:
      - backend
    networks:
      - orcamento_net
```

- [ ] **Step 10: Build and start `frontend` and verify the page loads**

Run: `docker compose up -d --build frontend`
Then run: `curl http://localhost:5173/`
Expected: the HTML response contains `<title>Orçamento Buffet</title>`

- [ ] **Step 11: Commit**

```bash
git add frontend docker-compose.yml
git commit -m "chore: add minimal frontend skeleton"
```

---

### Task 4: Full-stack verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: all three services from Tasks 1-3.
- Produces: a verified `docker compose up --build` entrypoint that the Backend and Frontend plans assume works before they start replacing skeleton code.

- [ ] **Step 1: Bring the whole stack down and volumes with it, for a clean slate**

Run: `docker compose down -v`
Expected: exits cleanly, `docker volume ls` no longer lists the project's `pgdata` volume.

- [ ] **Step 2: Bring the whole stack up from scratch**

Run: `docker compose up --build -d`
Expected: `docker compose ps` shows all three services (`db`, `backend`, `frontend`) as `Up` (and `db` as `(healthy)`).

- [ ] **Step 3: Verify each service end-to-end**

Run: `curl http://localhost:3000/health`
Expected: `{"status":"ok"}`

Run: `curl http://localhost:5173/`
Expected: HTML containing `<title>Orçamento Buffet</title>`

Run: `docker compose exec db psql -U buffet -d orcamento_buffet -c "SELECT 1;"`
Expected: a result row showing `1` (confirms the app-level Postgres credentials from `.env` actually work, not just the container health check).

- [ ] **Step 4: Tear down (keep volume, since real schema work starts in the Backend plan)**

Run: `docker compose down`

- [ ] **Step 5: Update `README.md` with the verified run steps**

Confirm the "Rodando o projeto" section from Task 1 Step 6 matches what you just verified (`docker compose up --build`, ports 3000 and 5173) — no changes needed if it already matches; otherwise correct it to match reality.

- [ ] **Step 6: Commit (only if README changed)**

```bash
git add README.md
git commit -m "docs: verify full-stack docker compose run instructions"
```
