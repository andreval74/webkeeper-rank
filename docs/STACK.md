# STACK.md

## Objetivo

Fixar a stack tecnológica oficial do WebKeeper Rank para evitar decisões inconsistentes ao longo do desenvolvimento.

## Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- TailwindCSS 4
- shadcn/ui
- TanStack Query
- Zustand
- Framer Motion
- Recharts

## Backend

- NestJS
- Fastify (adapter de HTTP)
- Prisma ORM
- PostgreSQL (Neon, gerenciado)
- Redis (Upstash, gerenciado) — introduzido quando necessário para cache/filas
- BullMQ — introduzido junto com Redis
- @nestjs/throttler — rate limiting para rotas públicas (ex: checagem sem login)

## Testes

- Backend: Jest + ts-jest, para testes unitários de serviços NestJS (mock de `PrismaService`/`JwtService`) — coexiste com `node:test` nativo (zero dependência) para a lógica pura de `wri-audit.util.ts`.
- Frontend: Vitest + @testing-library/react, para testes unitários de páginas (mock de `apiFetch`, `next/navigation`, Zustand store).
- Escopo hoje: apenas testes unitários (sem e2e, sem Postgres/Neon real, sem rede real) — ver `docs/DECISIONS.md`.

## IA (fase futura)

- OpenAI, Claude, Gemini, Groq — integrados via camada de abstração própria (nenhum módulo de negócio chama SDKs de IA diretamente).

## Infraestrutura

- Hoje: execução local via `npm run dev`, banco/cache gerenciados na nuvem (Neon/Upstash).
- Futuro: Docker + Docker Compose, GitHub Actions (CI/CD), Traefik — ver `docs/MASTER_CHECKLIST.md`.

## Regras

- Não trocar itens desta lista sem registrar a decisão em `docs/DECISIONS.md`.
- Sempre usar versões estáveis mais recentes disponíveis no momento da instalação de cada pacote.

## Decisões

- 2026-07-17: Stack definida conforme conversa de planejamento do produto.
- 2026-07-20: frameworks de teste definidos (Jest no backend para serviços, Vitest no frontend) — ver `docs/DECISIONS.md`.
- 2026-07-20: @nestjs/throttler adicionado para rate limiting da rota pública de checagem — ver `docs/DECISIONS.md`.

## Pendências

- Avaliar GraphQL como complemento ao REST quando necessário.

## Roadmap

Ver [docs/MASTER_CHECKLIST.md](MASTER_CHECKLIST.md).
