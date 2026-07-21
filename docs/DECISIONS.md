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

## 2026-07-20 — Motor de auditoria WRI ampliado para 14 checks determinísticos

**Decisão:** expandir `backend/src/modules/wri/wri-audit.util.ts` de 4 para 14 checks — **Security** (7: `https`, `ssl_cert_valid`, `csp`, `hsts`, `x_frame_options`, `x_content_type_options`, `referrer_policy`), **Performance** (2: `reachable`, `response_time`), **SEO** (5: `title_tag`, `meta_description`, `robots_txt`, `sitemap_xml`, `structured_data_jsonld`). Pesos por categoria mantidos (Security 30 / Performance 30 / SEO 40, soma 100), divididos igualmente entre os checks de cada categoria. Parsing só por regex, sem nova dependência. `response_time` binário com limite de 2000ms; timeout de rede de 8s para as chamadas novas (SSL, robots.txt, sitemap.xml). Testes de integração continuam adiados para a fase dedicada do roadmap ("Adicionar testes automatizados"), mas foram adicionados testes unitários leves com `node:test` (nativo do Node ≥20, zero dependência nova) cobrindo a lógica pura nova/alterada: `assignWeights`, parsing de JSON-LD, threshold de `response_time`, aritmética do score final.

**Motivo:** o MVP de 4 checks cobria só o fluxo ponta a ponta; `docs/PRODUCT.md` ("Níveis do WRI") descreve dezenas de métricas por categoria, e esta era a próxima fase de curto prazo já prevista em `docs/roadmap.html`. Antes de implementar, uma revisão de design encontrou 6 problemas técnicos no plano original — todos corrigidos nesta entrega: (1) `assignWeights` podia propagar `NaN`/`Infinity` silenciosamente se uma categoria ficasse com 0 checks — agora lança erro explícito; (2) `ssl_cert_valid` agora sempre entra no array de checks (`value:0` sem tentar conectar quando o site não usa HTTPS), eliminando ambiguidade na contagem por categoria; (3) `tls.connect()` com `rejectUnauthorized:true` (padrão) emite o evento `'error'` *antes* de `'secureConnect'` para certificado inválido — corrigido escutando os dois eventos; (4) checar só `response.ok` em `robots.txt`/`sitemap.xml` gerava falso positivo em SPAs com roteamento catch-all — corrigido rejeitando quando o `content-type` da resposta começa com `text/html`; (5) origem/hostname agora derivados de `response.url` (pós-redirect) em vez do domínio de entrada bruto, cobrindo redirects http→https e apex→www; (6) esta própria entrada registra formalmente o que antes só existia num arquivo de plano local.

**Impacto:** o peso dos 4 checks existentes muda (efeito da divisão igual dentro de cada categoria agora maior): `https` cai de 30 para ~4,29, `reachable` de 30 para 15, `title_tag`/`meta_description` de 20 para 8. A escala do score (0–100) não muda. Nenhuma mudança em `wri.service.ts`, `wri.controller.ts` ou `schema.prisma` — o mapeamento genérico de checks para `Metric`/`WriScore.breakdown` já cobre os novos checks automaticamente (Constituição, regra 6). Fecha a pendência "Detalhar fórmula de ponderação entre categorias do WRI" de `docs/PRODUCT.md`.

## 2026-07-20 — Frameworks de teste: dois runners no backend, Vitest no frontend

**Decisão**: o backend mantém dois test runners lado a lado: `node:test` (nativo, zero dependência) continua exclusivo de `backend/src/modules/wri/wri-audit.util.test.ts` — inalterado, já passando com 7 testes —, e Jest é adicionado como novo runner apenas para testes de serviço NestJS que precisam de DI/mocking (`auth.service.spec.ts`, `company.service.spec.ts`, `wri.service.spec.ts`). O frontend usa Vitest + @testing-library/react (não Jest). Escopo restrito a testes unitários — sem e2e, sem conexão real a Postgres/Neon, sem chamadas de rede reais; tudo mockado na borda (`PrismaService`, `JwtService`, `bcryptjs`, `wri-audit.util`, `apiFetch`/`fetch`, `next/navigation`, a store Zustand de auth).

**Motivo**: `wri-audit.util.test.ts` já existia, passava, e testa lógica pura sem qualquer necessidade de DI — reescrevê-lo em Jest só para unificar runner seria retrabalho sem ganho (Constituição, regra 9). Os novos testes de serviço, ao contrário, precisam mockar `PrismaService`/`JwtService` por injeção de dependência, algo que `node:test` não resolve de forma idiomática — Jest é o padrão do ecossistema NestJS para isso. No frontend, Vitest foi escolhido em vez de Jest para não introduzir um segundo runner desnecessário no mesmo workspace (o app já roda sobre Vite/Turbopack em dev via Next.js 16), e por ser o melhor encaixe atual para React 19 (ESM nativo). Ambas as escolhas de runner foram confirmadas explicitamente com o usuário antes da implementação (regra "na dúvida, pergunte").

**Impacto**: `backend/package.json` ganhou `jest`, `ts-jest`, `@types/jest`, `@nestjs/testing` como devDependencies e um bloco `"jest"` de configuração; o script `"test"` passou a rodar Jest, e o comando `tsx --test` (inalterado) migrou para a chave `"test:node"` (com `"test:all"` rodando os dois em sequência). `frontend/package.json` ganhou `vitest`, `@vitejs/plugin-react`, `vite`, `vite-tsconfig-paths`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, além de `vitest.config.ts`/`vitest.setup.ts`/`frontend/test/test-utils.tsx` e o script `"test"`. O `package.json` da raiz ganhou `test:backend`/`test:frontend`/`test` para orquestrar os três runners via npm workspaces. Nenhuma dependência de produção mudou; nenhum código de app (`main.ts`, páginas, serviços) foi alterado além dos arquivos `*.spec.ts`/`*.test.tsx` novos. Cobertura: 12 testes Jest (auth: 5, company: 4, wri: 3) + 7 testes `node:test` (inalterados) no backend; 5 testes Vitest (login: 2, dashboard: 3) no frontend — todos os caminhos críticos pedidos (registro/login, criar empresa/projeto, rodar auditoria/calcular score, fluxo de login, fluxo de dashboard). Fecha o item "Adicionar testes automatizados" de `docs/roadmap.html` (remoção do card pendente de verificação separada, ver regra do projeto em `CLAUDE.md`).

## 2026-07-20 — Checagem pública sem login vira a porta de entrada do produto

**Decisão**: a home (`/`) deixa de redirecionar para `/login` e passa a ser uma checagem pública de site — qualquer pessoa digita um domínio e recebe o WRI Score na hora, sem conta e sem persistência no banco. O fluxo autenticado (registro/login, multiempresa, histórico de WriScore) continua existindo exatamente como está, só deixa de ser a primeira tela. Endpoint novo: `POST /api/public/wri-check`, sem `JwtAuthGuard`, protegido por rate limiting (`@nestjs/throttler`, 5 requisições/minuto/IP, escopado só a essa rota) e validação básica de hostname (rejeita IP literal, `localhost`, hostnames sem TLD). Proteção completa contra SSRF (validar o IP resolvido, não só o hostname digitado) fica registrada como pendência em `docs/BACKLOG.md`, não bloqueia essa entrega.

**Motivo**: o usuário considerou obrigar login/senha como primeira experiência uma falha de visão do produto. Confirmado via explicação que a intenção é a checagem virar a porta de entrada livre, mantendo contas para quem quer salvar histórico e gerenciar multiempresa — não a remoção completa de contas do produto (regra "na dúvida, pergunte" do `CLAUDE.md`). Rate limiting é necessário porque a rota pública dispara chamadas de rede reais (`fetch`, `tls.connect`) para qualquer domínio informado, sem barreira de autenticação — sem mitigação isso é abuso fácil (Constituição, princípio "Security by Design").

**Impacto**: `frontend/app/page.tsx` deixa de redirecionar e vira a tela pública; `frontend/app/dashboard/page.tsx` reaproveita um componente novo (`WriScoreBreakdown`) extraído para não duplicar a exibição do score. Backend ganha `PublicWriController` e `public-domain-guard.util.ts` no módulo `wri`, mais a dependência `@nestjs/throttler`. Nenhuma mudança em `WriService`, `CompanyService`, `AuthService` ou no schema Prisma.
