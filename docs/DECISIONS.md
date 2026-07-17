# DECISIONS.md

Registro histórico de decisões arquiteturais e de produto. Toda mudança relevante deve ser adicionada aqui com data e motivo.

## 2026-07-17 — Escopo enxuto para o primeiro dia

**Decisão:** priorizar ter o sistema rodando ponta a ponta (backend + frontend + banco + login + primeiro cálculo do WRI) em vez de completar toda a documentação do Starter Kit Enterprise planejada na conversa original.

**Motivo:** evitar retrabalho por planejamento excessivo sem código; o usuário pediu explicitamente para "colocar em prática" ainda no mesmo dia.

**Impacto:** ~15 documentos adicionais, Design System completo, Wizard com UI, Docker e CI/CD completo ficam registrados como pendências em `docs/MASTER_CHECKLIST.md`.

## 2026-07-17 — Banco de dados e cache gerenciados na nuvem

**Decisão:** usar Neon (Postgres) e Upstash (Redis), ambos free tier, em vez de Docker local.

**Motivo:** Docker e Docker Desktop não estavam instalados na máquina de desenvolvimento; instalar exigiria habilitar WSL2/Hyper-V e possivelmente reiniciar o Windows, inviabilizando a entrega no mesmo dia.

**Impacto:** infraestrutura containerizada (`docker-compose.yml`) fica pendente para quando o usuário instalar Docker Desktop.

## 2026-07-17 — Stack bleeding edge confirmada

**Decisão:** Next.js 16 + React 19, conforme definido na conversa original, mantidos mesmo sendo versões recentes.

**Motivo:** confirmado explicitamente pelo usuário; Node 24 instalado é compatível.

**Impacto:** monitorar possíveis incompatibilidades de bibliotecas de terceiros com React 19 durante o desenvolvimento.
