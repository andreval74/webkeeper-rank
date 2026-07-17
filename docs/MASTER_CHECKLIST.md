# MASTER_CHECKLIST.md

Checklist do que existe e do que falta no WebKeeper Rank. O Claude Code deve consultar este arquivo antes de implementar novas funcionalidades.

## Infraestrutura base

- [x] Estrutura do monorepo
- [x] Documentação essencial (VISION, PRODUCT, ARCHITECTURE, STACK, CLAUDE.md)
- [ ] Documentação completa (MODULES, RULES, AI_AGENTS, UX_UI, DESIGN_SYSTEM, DATABASE, API, SECURITY, NON_FUNCTIONAL, OBSERVABILITY, DEPLOY, TESTING, CHANGELOG)
- [ ] Docker Compose / containerização (bloqueado: Docker não instalado na máquina atual)
- [ ] CI/CD completo (GitHub Actions: lint, test, build, deploy)
- [ ] Dependabot, CODEOWNERS

## Backend

- [x] Bootstrap NestJS + Fastify
- [x] Prisma schema mínimo (User, Company, Project, Metric, WriScore)
- [x] Módulo de autenticação (JWT) básico
- [x] Módulo de empresa (Company) básico
- [x] Primeiro cálculo determinístico do WRI Score
- [ ] Módulos completos: SEO, GEO, AEO, Brand, Authority, Performance, UX, Reputation, Social, Local, Security, Conversion
- [ ] Filas assíncronas (BullMQ + Redis/Upstash)
- [ ] Multiempresa/permissões avançadas por perfil de usuário

## Frontend

- [x] Bootstrap Next.js 16 + React 19
- [x] Tela de login
- [x] Dashboard inicial exibindo o WRI Score
- [ ] Design System completo (paleta oficial, tipografia, componentes, dark theme, motion)
- [ ] Wizard de configuração com UI administrativa

## Configuração / Wizard

- [x] `.env.example` versionado (root, backend, frontend)
- [x] Script `scripts/check-env.ts` de validação
- [ ] Wizard de configuração com UI (`config/wizard.schema.json`, etc.)

## IA

- [ ] Camada de abstração para provedores de IA (OpenAI, Claude, Gemini, Groq)
- [ ] Primeiro agente de IA (explicação de recomendações)

## Integrações externas

- [ ] Google Search Console, Google Analytics, Google Business
- [ ] Semrush, Ahrefs, Moz, DataForSEO, SerpAPI
- [ ] Redes sociais (Meta, LinkedIn, TikTok)

## Billing / Operação

- [ ] Billing (Stripe/Mercado Pago/Asaas/Pagar.me)
- [ ] Observabilidade (Grafana, Prometheus, Sentry)
- [ ] Backup, CDN, rate limit, webhooks
