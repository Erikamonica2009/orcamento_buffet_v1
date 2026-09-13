# Sistema de Orçamento de Buffet — Design

Data: 2026-09-13

## Contexto e objetivo

Sistema web para um buffet de eventos onde o cliente se cadastra, solicita
um orçamento para um evento, e um administrador analisa o pedido e responde
com um valor. Este projeto é a entrega prática da disciplina "Segurança em
Sistemas da Informação" (Professor Wagner), cujo trabalho exige implementar
três pilares de segurança em um sistema com contato direto e alto volume de
público:

1. Rate limiting contra abuso de endpoints públicos (flood de cadastro/pedido).
2. Tratamento de erro no backend (nunca vazar detalhes internos/stack trace).
3. Prevenção de SQL Injection (queries parametrizadas).

O design também segue a "estrutura profissional" de organização de código
ensinada na disciplina (camadas controller/service/repository/model, testes
separados, `.env`, `.gitignore`, README) e as recomendações de segurança de
front-end do slide-deck da disciplina (ver Seção 6).

## Escopo

CRUDs de: administradores, clientes, tipos de evento, itens de evento
(catálogo agrupado por categoria). Tela de gestão de orçamentos solicitados,
com fluxo de status. Autenticação com dois perfis (cliente / admin) e
permissões por papel. Empacotado em Docker (Postgres + backend + frontend).

Fora de escopo: pagamento online, geração de PDF/contrato, notificação por
e-mail/SMS, múltiplos idiomas.

## Arquitetura geral

Monorepo com três serviços orquestrados por `docker-compose`:

```
orcamento_buffet/
├── docker-compose.yml
├── .env
├── .gitignore
├── README.md
├── docs/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── src/
│   │   ├── main.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── middlewares/      # auth (JWT), rate limit, error handler, validação
│   │   └── config/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── tests/
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── .env
    ├── src/
    │   ├── main.tsx
    │   ├── pages/
    │   ├── components/
    │   ├── services/
    │   ├── routes/
    │   └── config/
    └── tests/
```

Stack: **Node.js + Express + TypeScript** no backend, **Prisma** como ORM
sobre **PostgreSQL**, **React + Vite + TypeScript** no frontend.

Fluxo de camadas no backend: `Controller` (valida shape do request com Zod)
→ `Service` (regra de negócio) → `Repository` (única camada que fala com o
Prisma) → PostgreSQL. Nenhuma camada monta SQL por concatenação de string.

## Modelo de dados

```
admins
├── id                PK
├── nome
├── email             (unique)
├── senha_hash
└── created_at

clientes
├── id                PK
├── nome
├── email             (unique)
├── senha_hash
├── telefone
├── cpf               (unique)
└── created_at

tipos_evento
├── id                PK
├── nome
├── descricao
└── ativo             (exclusão lógica)

itens
├── id                PK
├── nome
├── descricao
├── categoria         (enum: COMIDA | BEBIDA | DECORACAO | ESTRUTURA | ENTRETENIMENTO)
└── ativo

orcamentos
├── id                PK
├── cliente_id        FK -> clientes
├── tipo_evento_id    FK -> tipos_evento
├── data_evento
├── num_convidados
├── observacoes
├── status            (enum: PENDENTE | EM_ANALISE | APROVADO | RECUSADO)
├── valor_total       (nullable — preenchido pelo admin na resposta)
├── respondido_por_id FK -> admins (nullable)
├── respondido_em     (nullable)
└── created_at

orcamento_itens        (N:N — só marca quais itens o cliente escolheu, sem preço)
├── orcamento_id       FK -> orcamentos
└── item_id            FK -> itens
```

Decisões:
- `categoria` do item é um enum simples, não um CRUD separado (YAGNI —
  categorias mudam raramente; pode virar tabela depois se necessário).
- Preço não vive no catálogo de itens nem na tabela de junção: o admin
  define um único `valor_total` por orçamento no momento da resposta.
- `ativo` em `tipos_evento`/`itens` permite exclusão lógica preservando o
  histórico de orçamentos que referenciam esses registros.

## Autenticação e autorização

Dois perfis com tabelas separadas (`admins`, `clientes`), cada um com seu
próprio endpoint de login (`/auth/admin/login`, `/auth/cliente/login`),
emitindo um JWT (`{ id, role }`). Middleware `requireAuth` valida o token;
`requireRole('admin')` protege rotas de gestão (tipos de evento, itens,
listagem de clientes, gestão de orçamentos). O cliente autenticado só
acessa orçamentos filtrados pelo `cliente_id` do próprio token — nunca por
um id vindo do body/query da request.

O JWT é entregue em cookie `httpOnly` + `Secure` + `SameSite=Lax` (nunca em
`localStorage`): o payload do JWT é só Base64, legível por quem tiver
acesso ao token, então ele precisa ficar inacessível a JavaScript no
browser para mitigar roubo via XSS.

## Os três pilares de segurança (backend)

**Rate limiting** (`express-rate-limit`), aplicado em:
- `POST /auth/*/login`: limite agressivo (ex.: 5 tentativas/min por IP)
  contra brute-force de senha.
- `POST /clientes` (cadastro) e `POST /orcamentos` (pedido de orçamento):
  limite mais generoso (ex.: 20/min por IP) contra flood de spam — este é
  o vetor de abuso real de um sistema de contato direto com o público.

**Tratamento de erro centralizado:** classe `AppError` (com `statusCode` e
mensagem segura para expor) usada em services/controllers. Um middleware de
erro, último da chain do Express, captura qualquer exceção — incluindo
falhas de infraestrutura (ex.: conexão com o banco caindo) — loga o erro
completo no servidor e responde sempre com um JSON padronizado
(`{ error: "mensagem genérica" }`), nunca vazando stack trace ou detalhe
interno.

**Prevenção de SQL Injection:** todo acesso a dado passa pelo Prisma, que
parametriza automaticamente as queries. Nenhuma camada concatena SQL a
partir de input do usuário. Se um relatório futuro precisar de SQL bruto,
só entra via `$queryRaw` com parâmetros tipados, nunca template string
interpolado.

## Frontend

Rotas:

```
/login                    (seleção cliente/admin)
/cadastro                 (auto-cadastro de cliente)

# role=cliente
/meus-orcamentos          (lista + form de novo pedido de orçamento)

# role=admin — menu lateral com 2 módulos
Cadastros
  /admins
  /clientes
  /tipos-evento
  /itens
Orçamentos
  /orcamentos              (lista, filtro por status)
  /orcamentos/:id          (detalhe → aprovar/recusar/definir valor_total)
```

`ProtectedRoute` valida token + role antes de renderizar; a sidebar só
exibe os módulos permitidos pelo role logado.

### Hardening de segurança no frontend

Com base no slide "Segurança em Sistemas da Informação" da disciplina, que
trata o front-end como primeira linha de defesa (não apenas estética):

- **Validação de formulário:** limite de caracteres, campos obrigatórios,
  máscaras de CPF/telefone, tipagem de input (`type="email"`, `type="number"`).
- **CSP:** header `Content-Security-Policy` (definido pelo backend ou via
  meta tag no `index.html`) restringindo origem de scripts.
- **Sanitização de output:** campos livres do cliente (ex.: `observacoes`)
  passam por DOMPurify antes de qualquer renderização que use HTML bruto.
- **Timeout de sessão:** logout automático por inatividade; tratamento de
  token expirado com redirecionamento limpo para o login.
- **UX defensivo:** desabilitar botão de submit após o clique (evita duplo
  envio/duplicidade de orçamento); popup de confirmação em ações
  destrutivas do admin (excluir cliente/orçamento); feedback de
  loading em toda chamada assíncrona.
- **Páginas de erro próprias:** Error Boundary do React + páginas 404/500
  customizadas, nunca expondo stack trace no browser — espelha a mesma
  regra do backend.

## Docker / orquestração

`docker-compose.yml` na raiz com 3 serviços:

- `db`: `postgres:16-alpine`, volume nomeado `pgdata`, healthcheck.
- `backend`: build de `./backend`; depende do `db` estar healthy; roda as
  migrations do Prisma no start.
- `frontend`: build de `./frontend`; serve o build via Nginx (ou
  `vite preview`).

Rede interna própria (`orcamento_net`). Apenas `frontend` e `backend`
expõem porta para o host; `db` fica acessível somente na rede interna.

## Testes

Backend: testes unitários dos `services` (regra de negócio: cálculo de
status, restrição de acesso por role) e testes de integração dos
`controllers` principais (login, criar orçamento, aprovar orçamento) com
Vitest + Supertest, contra um banco de teste isolado. Erros de validação
(Zod) e de negócio (`AppError`) retornam 400/404 com mensagem segura;
qualquer erro não previsto cai no handler central (500 genérico + log).

## Fora de escopo / decisões conscientes não implementadas

- CRUD de categorias de item (fica como enum fixo por ora).
- Precificação por item (o admin define um valor único por orçamento).
- Notificação por e-mail/SMS ao cliente quando o orçamento é respondido.
- Pagamento online / geração de contrato em PDF.
