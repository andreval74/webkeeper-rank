# ARCHITECTURE.md

## Objetivo

Descrever a arquitetura técnica do WebKeeper Rank e as razões por trás dela.

## Responsabilidades

Guiar decisões estruturais de backend, frontend e infraestrutura, mantendo coerência com os princípios de engenharia definidos em `CLAUDE.md`.

## Visão geral

Monorepo com npm workspaces:

```
webkeeper-rank/
├── backend/     NestJS + Fastify — Modular Monolith
├── frontend/    Next.js 16 (App Router) + React 19
├── packages/    Código compartilhado (tipos/DTOs TypeScript)
└── docs/        Documentação
```

- **Modular Monolith inicialmente.** Backend organizado em módulos NestJS (`auth`, `company`, `wri`, ...) com fronteiras claras, para permitir extração futura em microserviços apenas quando houver necessidade real de escala/isolamento — nunca por padrão.
- **API First.** Frontend consome o backend exclusivamente via API HTTP (REST hoje; GraphQL avaliado futuramente, ver `API.md` pendente).
- **Banco de dados.** PostgreSQL gerenciado (Neon) via Prisma ORM. Redis (Upstash) para cache/filas (BullMQ), introduzido quando o primeiro fluxo assíncrono for necessário.
- **Autenticação.** JWT emitido pelo backend; sessão armazenada no frontend via cookies httpOnly.

## Fluxo (implementação mínima de hoje)

```
Browser (Next.js) → API NestJS (Fastify) → Prisma → PostgreSQL (Neon)
```

Sem containers hoje (Docker não disponível na máquina de desenvolvimento) — backend e frontend rodam via `npm run dev` diretamente, conectando a serviços gerenciados na nuvem.

## Dependências

- Neon (Postgres) — obrigatório para persistência.
- Upstash (Redis) — opcional na fase inicial, necessário para filas/cache.

## Regras

- Nenhum módulo do backend acessa o banco de outro módulo diretamente — sempre via serviços/repositórios do próprio módulo.
- Toda variável de ambiente sensível fica fora do controle de versão (`.env`, gitignored) — apenas `.env.example` é versionado.
- Nunca commitar credenciais reais.

## Decisões

- 2026-07-17: Adiado Docker/Docker Compose por ausência de Docker instalado na máquina; usar serviços cloud gerenciados (Neon/Upstash) até a infraestrutura containerizada ser retomada. Ver `docs/DECISIONS.md`.

## Pendências

- `DATABASE.md` com modelagem completa, índices e migrações.
- `API.md` com contratos completos de endpoints.
- `SECURITY.md`, `OBSERVABILITY.md`, `DEPLOY.md`.

## Roadmap

Ver [docs/MASTER_CHECKLIST.md](MASTER_CHECKLIST.md).
