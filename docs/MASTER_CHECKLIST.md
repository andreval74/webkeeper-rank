# MASTER_CHECKLIST.md

Checklist do que existe e do que falta no WebKeeper Rank. O Claude Code deve consultar este arquivo antes de implementar novas funcionalidades.

## Infraestrutura base

- [x] Estrutura do monorepo
- [x] Documentação essencial (VISION, PRODUCT, ARCHITECTURE, STACK, CLAUDE.md)
- [ ] Documentação completa (MODULES, RULES, AI_AGENTS, UX_UI, DESIGN_SYSTEM, DATABASE, API, SECURITY, NON_FUNCTIONAL, OBSERVABILITY, DEPLOY, TESTING, CHANGELOG)
- [x] Testes automatizados (backend: Jest + `node:test` · frontend: Vitest + Testing Library) — cobertura de caminhos críticos (auth, company, wri no backend; login e dashboard no frontend)
- [ ] Docker Compose / containerização (bloqueado: Docker não instalado na máquina atual)
- [x] CI/CD validação (GitHub Actions: lint, test, build, sem deploy)
- [ ] CI/CD completo com deploy
- [ ] Dependabot, CODEOWNERS

## Backend

- [x] Bootstrap NestJS + Fastify
- [x] Prisma schema mínimo (User, Company, Project, Metric, WriScore)
- [x] Módulo de autenticação (JWT) básico
- [x] Módulo de empresa (Company) básico
- [x] Motor de auditoria determinística ampliado (14 checks: Security 7 / Performance 2 / SEO 5)
- [x] Rota pública de checagem (sem login), com rate limiting e validação de hostname
- [x] Módulos WRI base (SEO, Security, Performance) — 14 checks determinísticos + rota pública
- [x] Módulo GEO (Generative Engine Optimization) — 8 checks iniciais, padrão replicável
- [x] Módulo AEO (Answer Engine Optimization) — 8 checks, padrão GEO replicado
- [ ] Módulos restantes (Brand, Authority, UX, Reputation, Social, Local, Conversion) — usar padrão GEO/AEO
- [ ] Filas assíncronas (BullMQ + Redis/Upstash)
- [ ] Multiempresa/permissões avançadas por perfil de usuário

## Frontend

- [x] Bootstrap Next.js 16 + React 19
- [x] Tela de login
- [x] Dashboard inicial exibindo o WRI Score
- [x] Home pública de checagem de site (sem login), com CTA para criar conta
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
