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

## 2026-07-19 — Automação do roadmap sob demanda, não autônoma/agendada

**Decisão:** o ciclo "executar fase do roadmap → verificar → atualizar `docs/roadmap.html`" roda apenas sob demanda (comando `/living-roadmap next-step`, acionado explicitamente numa sessão). Não foi configurado cron/agendamento, nem instalado o plugin `ralph-loop` (loop autônomo disponível no marketplace oficial mas não instalado).

**Motivo:** confirmado explicitamente pelo usuário entre as opções apresentadas; execução autônoma sem supervisão geraria custo recorrente e risco de commitar código sem revisão humana, o que contraria a Constituição do projeto, regra 8 ("toda automação deve ser reversível") e regra 9 (simplicidade).

**Impacto:** o sistema não "roda sozinho" — cada fase de "Próximos passos" só avança quando alguém pede. Se no futuro a automação agendada/autônoma fizer sentido, deve ser uma nova decisão explícita registrada aqui, não assumida por padrão.

## 2026-07-19 — Correção de rumo: revertida a generalização prematura do sistema de roadmap

**Decisão:** a skill reutilizável de nível de usuário `living-roadmap` (criada mais cedo no mesmo dia para "servir qualquer projeto futuro") foi removida. `docs/roadmap.html`, `docs/EXECUTION_LOG.md` e `.claude/agents/roadmap-verifier.md` continuam existindo, mas voltam a ser específicos do WebKeeper Rank, sem pretensão de reuso.

**Motivo:** o usuário identificou que o sistema nasceu para resolver uma necessidade concreta deste projeto e foi generalizado antes de o padrão ser validado num caso real — contrariando a Constituição, regra 9 (simplicidade) e a própria regra de "registrar melhorias no backlog em vez de expandir escopo sem alinhamento". Além disso, a visão real do usuário para "gerar projetos do zero" (subagentes especializados, modo plan/ultraplan, loop de revisão com auto-repair, entrega final de sistema completo) é um projeto de porte muito maior do que a skill criada — generalizar cedo teria consolidado a abstração errada.

**Impacto:** a visão do gerador de projetos completo fica registrada como iniciativa futura separada, fora deste repositório (`C:\Users\User\.claude\PROJECT_IDEAS.md`), a ser construída depois, informada pela experiência real registrada em `docs/EXECUTION_LOG.md` e na memória deste projeto — não como uma extensão apressada do que já existe.
