# BACKLOG.md

Itens planejados que ficaram fora do escopo do primeiro dia. Ver também `docs/MASTER_CHECKLIST.md`.

## Documentação pendente

- MODULES.md, RULES.md, AI_AGENTS.md, UX_UI.md
- DESIGN_SYSTEM.md (paleta oficial inspirada em webkeeper.com.br, tipografia, componentes, dark theme, motion)
- DATABASE.md, API.md, SECURITY.md, NON_FUNCTIONAL.md, OBSERVABILITY.md, DEPLOY.md, TESTING.md, CHANGELOG.md

## Produto

- Módulos completos por categoria do WRI (GEO, AEO, Brand, Authority, UX, Reputation, Social, Local, Conversion).
- Camada de abstração para provedores de IA e primeiro agente de IA explicativo.
- Wizard de configuração com UI administrativa (hoje apenas `.env` + `scripts/check-env.ts`).

## Infraestrutura

- Docker Compose (bloqueado até Docker ser instalado localmente).
- CI/CD completo via GitHub Actions (lint, test, build, deploy), Dependabot, CODEOWNERS.

## Integrações

- Google Search Console, Analytics, Business; Semrush, Ahrefs, Moz, DataForSEO, SerpAPI; redes sociais.
- Billing (Stripe/Mercado Pago/Asaas/Pagar.me).
