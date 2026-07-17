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

## Pendências

- Avaliar GraphQL como complemento ao REST quando necessário.

## Roadmap

Ver [docs/MASTER_CHECKLIST.md](MASTER_CHECKLIST.md).
