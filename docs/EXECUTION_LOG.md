# EXECUTION_LOG.md

## Objetivo

Registro condensado e cronológico de toda conversa/pedido relevante feito à IA neste projeto — o que foi pedido, o prompt executável gerado (quando o pedido virou ação de código), e o status. Serve para saber, a qualquer momento, o que já foi feito no sistema sem precisar reconstruir o histórico a partir do chat.

## Responsabilidades

Complementa (não duplica) o `claude-mem`, que já captura observações automáticas em segundo plano de forma privada: este arquivo é a versão condensada, legível e versionada no git, visível para qualquer pessoa (ou IA) que abrir o projeto. Também complementa `docs/DECISIONS.md` (que registra só decisões arquiteturais) e `docs/roadmap.html` (que mostra o estado atual, não o histórico completo).

## Dependências

`docs/roadmap.html` (seção "Prompts prontos para rodar"), `docs/DECISIONS.md`, `docs/MASTER_CHECKLIST.md`, `docs/BACKLOG.md`.

## Fluxo

Toda vez que um pedido do usuário for alinhado/executado (manualmente ou via `/living-roadmap next-step` ou `/living-roadmap log`), uma entrada é adicionada ao final deste arquivo, no formato:

```
## AAAA-MM-DD — <título curto>
**Pedido:** <resumo alinhado do que foi pedido>
**Prompt gerado:** <o prompt executável, se houve ação de código — ou "N/A">
**Status:** Executado e verificado | Executado (verificação pendente) | Pendente de execução
**Resultado:** <1–3 linhas: o que mudou, quais arquivos>
```

## Regras

- Nunca remover entradas — é um log append-only, mesmo que o trabalho descrito depois seja revertido (registra-se uma nova entrada explicando a reversão).
- Toda entrada com prompt executado deve ter sido verificada (subagente `roadmap-verifier`, ou `/verify`/`/code-review`) antes de marcar como "Executado e verificado".
- Datas em formato absoluto (AAAA-MM-DD), nunca relativo.

## Exemplos

Ver entradas abaixo.

## Decisões

- 2026-07-19: criado como parte do pacote de automação/template do sistema de roadmap vivo (ver `docs/DECISIONS.md` e a skill `living-roadmap` em `C:\Users\User\.claude\skills\living-roadmap\`).

## Pendências

Nenhuma no momento.

## Roadmap

Ver `docs/roadmap.html` e `docs/MASTER_CHECKLIST.md`.

---

## 2026-07-19 — Dashboard visual de status (docs/roadmap.html)

**Pedido:** Recriar o Artifact de Visão & Produto salvo em `docs/`, incluindo um roadmap real (onde o projeto está, o que fazer a seguir) e mantido atualizado conforme o projeto evolui.

**Prompt gerado:** N/A — trabalho de documentação/design executado diretamente na sessão (skill `/visual-explainer`), sem prompt intermediário.

**Status:** Executado e verificado (checagem estrutural via script Node: TOC/ids batendo, sem atributos duplicados; `diff` confirmando `CLAUDE.md` e `docs/CLAUDE.md` idênticos).

**Resultado:** Criado `docs/roadmap.html` (10 seções: Visão, Status atual, Próximos passos, Pilares, Índice WRI, Fluxo mínimo, Perfis, Recomendações & Automação, Decisões, Fora do escopo), cruzando `docs/MASTER_CHECKLIST.md`/`DECISIONS.md`/`BACKLOG.md` com o estado real do código (ex. auditoria WRI identificada como MVP de 4 checks, não a auditoria completa descrita em `PRODUCT.md`). Adicionada a seção "Dashboard visual de status" em `CLAUDE.md` (raiz e `docs/`) e memória de projeto `roadmap-dashboard-convention.md`.

---

## 2026-07-19 — Prompts executáveis por fase

**Pedido:** Estruturar, para cada fase pendente identificada no roadmap, um prompt pronto para rodar; depois de executado, verificar com um agente se o resultado ficou como esperado antes de remover ou ajustar o prompt.

**Prompt gerado:** N/A — pedido sobre a estrutura do próprio `docs/roadmap.html`, não uma fase de implementação do produto.

**Status:** Executado e verificado (script Node confirmando 10 prompt-cards, 3+4+3 batendo com "Próximos passos", 10 botões de copiar, TOC de 11 seções consistente; `diff` de `CLAUDE.md` continua idêntico).

**Resultado:** Nova seção "Prompts prontos para rodar" em `docs/roadmap.html` com 10 prompts colapsáveis (3 curto prazo, 4 médio prazo, 3 longo prazo) e botão de copiar. `CLAUDE.md` (raiz e `docs/`) ganhou a regra do ciclo de vida dos prompts (executar → verificar via `/verify`/`/code-review` → só então remover/ajustar).

---

## 2026-07-19 — Automação sob demanda + template reutilizável (`living-roadmap`)

**Pedido:** Automatizar o ciclo do roadmap para virar modelo reaproveitável em projetos futuros; analisar e integrar melhorias opcionais; criar agentes/instalar skills se necessário; documentar o que foi adicionado; registrar toda conversa relevante como prompt executável armazenado. Esclarecido via perguntas: automação sob demanda (não autônoma/agendada), skill reutilizável de nível de usuário, log condensado versionado. Feedback adicional do usuário: todo prompt e a skill devem instruir a perguntar ao usuário em caso de dúvida durante a execução.

**Prompt gerado:** N/A — trabalho de tooling/meta-automação, não uma fase de produto do WRI.

**Status:** Executado (verificação pendente — este pacote ainda não passou pelo `roadmap-verifier`, que só passa a existir a partir desta própria entrega).

**Resultado:** Criados `.claude/agents/roadmap-verifier.md` (subagente verificador local), `docs/EXECUTION_LOG.md` (este arquivo), e a skill reutilizável `living-roadmap` em `C:\Users\User\.claude\skills\living-roadmap\` (modos `init`/`next-step`/`log`, template de HTML genérico, template de log, template de subagente, snippet de `CLAUDE.md`). `docs/roadmap.html` atualizado (callout "como usar", rodapé, e frase "pergunte na dúvida" em todos os 10 prompts). `docs/BACKLOG.md` ganhou o item adiado do gerador markdown→HTML automático. `CLAUDE.md` (raiz e `docs/`) e a memória de projeto atualizados com a existência da skill, do agente e do log. Nenhum plugin externo foi instalado (`ralph-loop`/cron descartados explicitamente pelo usuário); nenhuma das 10 fases de "Próximos passos" foi executada — esta entrega é a ferramenta, não o resultado de usá-la.

---

## 2026-07-19 — Correção de rumo: skill genérica revertida

**Pedido:** O usuário questionou se a skill `living-roadmap` realmente serviria para qualquer projeto e construiria sistemas do zero (com subagentes especializados, modo plan/ultraplan, loop de revisão com auto-repair, entrega final) — e concluiu que o processo generalizou cedo demais. Pediu para restringir tudo de volta ao WebKeeper Rank e registrar a visão maior como um projeto futuro separado, fora deste repositório.

**Prompt gerado:** N/A — correção de rumo/escopo, não uma fase de produto do WRI.

**Status:** Executado e verificado (skill removida confirmada por listagem de diretório; `docs/roadmap.html` e `CLAUDE.md` conferidos sem referências soltas a `/living-roadmap`; `diff` de `CLAUDE.md`/`docs/CLAUDE.md` continua idêntico).

**Resultado:** Removida `C:\Users\User\.claude\skills\living-roadmap\` inteira. `docs/roadmap.html` (callout, rodapé, nova decisão em "Decisões recentes"), `CLAUDE.md` (raiz e `docs/`) e `docs/DECISIONS.md` atualizados para refletir que o sistema é específico deste projeto. Criado `C:\Users\User\.claude\PROJECT_IDEAS.md` registrando a visão do gerador de projetos completo como iniciativa futura separada. Memória do projeto corrigida; nova memória `feedback` registrando a lição de não generalizar ferramentas antes de validar o padrão num caso real.

---

## 2026-07-19 — Melhoria de layout de docs/roadmap.html

**Pedido:** Melhorar o layout do arquivo gerado pela skill `/visual-explainer` (`docs/roadmap.html`), que cresceu em 4 rodadas de edição sem nunca ser revisto como um todo do ponto de vista visual.

**Prompt gerado:** N/A — refinamento de CSS/layout num arquivo já existente, sem novo conteúdo de produto.

**Status:** Executado e verificado (checagem estrutural via script Node: TOC/ids batendo, sem atributos duplicados; pares light/dark conferidos para as novas variáveis de cor).

**Resultado:** Auditoria (agente Explore) levantou 15 problemas de consistência visual acumulados nas rodadas anteriores. Principais correções em `docs/roadmap.html`: os 10 prompts de "Prompts prontos para rodar" agora são agrupados por prazo (curto/médio/longo) com cor e rótulo, reaproveitando a paleta já usada em "Próximos passos" — antes era uma lista plana sem diferenciação visual. As três caixas de callout quase-duplicadas (`.risk-callout`, `.prompt-howto`, `.callout`) foram unificadas numa base + modificadores de cor. Padronizado o estilo de `<code>` inline (antes inconsistente — vários apareciam sem estilo). Duas cores hardcoded em hex viraram variáveis do tema com par light/dark. Corrigido CSS morto (`:first-of-type` que nunca aplicava) e a regra `min-width:0` (mirava seletores que não existiam na página). Sistema de cards harmonizado (radius único, 2 escalas de padding em vez de 3). Introduzido um nível visual "recessed" nas seções de apoio (Pilares, Fluxo mínimo) para diferenciá-las das seções mais densas/importantes (Status atual, Índice WRI). Numeração da TOC alinhada com a dos cabeçalhos de seção. Nenhum conteúdo/texto foi alterado — só apresentação.

---

## 2026-07-19 — Melhorias direcionadas: Status atual, fusão Próximos passos + Prompts, Pilares, Fluxo mínimo

**Pedido:** Melhorar especificamente as seções "02 Status atual", "05 Pilares do produto" e "07 Fluxo mínimo", e unificar "03 Próximos passos" com "04 Prompts prontos para rodar" (sugestão do usuário — os dois listavam os mesmos 10 itens em formatos redundantes).

**Prompt gerado:** N/A — refinamento de layout num arquivo já existente.

**Status:** Executado e verificado (checagem estrutural via script Node: 10 seções, TOC/ids batendo, CSS balanceado, soma do KPI = 22 = total real de itens de status, nenhuma classe órfã de `.timeline`/`.tl-card`).

**Resultado:** `docs/roadmap.html` passou de 11 para 10 seções. **Status atual** ganhou uma linha de KPIs no topo (9 Concluído · 1 Parcial · 11 Pendente · 1 Bloqueado — resumo executivo antes do detalhe por área). **Próximos passos** e **Prompts prontos para rodar** foram fundidos numa seção só: cada um dos 10 itens agora aparece uma única vez, como card colapsável agrupado por prazo (curto/médio/longo) em 3 colunas — antes cada item aparecia duas vezes (bullet simples + card de prompt separado). CSS morto de `.timeline`/`.tl-card` removido e substituído por `.next-steps-grid` (reaproveitando `.prompt-list`/`.prompt-group-label` já existentes). **Pilares do produto** ganharam um ícone SVG por pilar (substituindo o número mono "01"–"07"), e a nota de "ciclo contínuo" virou um selo/pill dourado. **Fluxo mínimo** ganhou um selo verde de "confirmado manualmente" ao final do pipeline, reforçando visualmente o "já funciona hoje" do título. Seções seguintes renumeradas (04→10). Nenhum texto de conteúdo foi alterado além do necessário para a fusão.

---

## 2026-07-19 — Sumário colapsável, Pilares em grid fixo, Status atual em 2 colunas

**Pedido:** (1) TOC/sumário lateral virar um menu colapsável ("sanfona") para liberar espaço de tela; (2) a seção "Pilares do produto" estava com um wrap de flexbox ruim (setas órfãs entre linhas, aparência de rolagem horizontal) — pedido para reorganizar em 2 linhas fixas com ícone e número por pilar; (3) "Status atual" distribuído em 2 colunas x 2 linhas fixas para os 4 módulos/áreas.

**Prompt gerado:** N/A — refinamento de layout num arquivo já existente, a partir de feedback visual direto (screenshot) do usuário.

**Status:** Executado e verificado (checagem estrutural via script Node: TOC/ids batendo, CSS balanceado, 10/10 `<details>`, nenhuma referência órfã a `.pillar-arrow`, sequência 01–07 dos pilares intacta).

**Resultado:** TOC (`nav#toc`) ganhou um botão de colapsar (`#tocToggle`) que reduz a coluna lateral de 200px para 40px, escondendo os rótulos e mantendo só o botão — estado persistido via `localStorage` (`wri-toc-collapsed`), desativado no breakpoint mobile (que já usa barra horizontal compacta). **Pilares do produto**: `.pillar-flow` trocou de `flex-wrap` (com setas "→" entre cards, que quebravam mal em 2 linhas) para `display:grid` de 4 colunas — 7 cards caem naturalmente em 2 linhas (4+3), sem rolagem horizontal e sem seta órfã. Cada card ganhou de volta o número (01–07) ao lado do ícone, num cabeçalho `.p-head` combinando os dois. **Status atual**: `.area-grid` trocou de `auto-fit` (que podia mostrar de 1 a 4 colunas dependendo da largura) para `repeat(2, 1fr)` fixo — sempre 2 colunas x 2 linhas em telas maiores que 768px, com override para 1 coluna no mobile.

---

## 2026-07-19 — Fluxo mínimo em duas linhas

**Pedido:** Distribuir a seção "06 Fluxo mínimo — já funciona hoje" (5 passos do pipeline) em duas linhas, mesmo tratamento já aplicado aos Pilares do produto.

**Prompt gerado:** N/A — ajuste pontual de layout.

**Status:** Executado e verificado (checagem estrutural: CSS balanceado, 5 pipeline-steps, sequência PASSO 1–5 intacta, nenhuma referência órfã a `.pipeline-arrow`).

**Resultado:** `.pipeline` trocou de `flex` com setas "→" entre os 5 passos para `display:grid` de 3 colunas — os passos caem naturalmente em 2 linhas (3+2), sem rolagem horizontal e sem seta órfã, mesmo padrão já usado nos Pilares. A sequência continua clara pelos rótulos "PASSO 1"–"PASSO 5" de cada card. Mobile ajustado para 2 colunas.
