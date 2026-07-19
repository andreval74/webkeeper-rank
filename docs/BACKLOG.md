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

## Automação / Tooling

- Gerador automático de `docs/roadmap.html` a partir dos `.md` (MASTER_CHECKLIST, DECISIONS, BACKLOG, EXECUTION_LOG) — considerado em 2026-07-19 ao montar o sistema de roadmap vivo, mas adiado deliberadamente para não expandir o escopo daquela entrega sem alinhamento prévio (Constituição, regra 9 — simplicidade; regra do CLAUDE.md sobre propor melhorias registrando-as no backlog). Hoje o dashboard é regenerado por uma sessão de IA seguindo a convenção documentada em `CLAUDE.md`; um script determinístico (ex. `scripts/generate-roadmap.ts`) tornaria isso mais robusto e menos dependente de reescrever HTML à mão a cada atualização.
