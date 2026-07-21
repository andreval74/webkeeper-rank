# Checagem pública sem login (design)

## Objetivo

Adicionar uma checagem de site pública, sem exigir conta, como porta de entrada do WebKeeper Rank — quem digita um domínio recebe o WriScore na hora. O fluxo autenticado (registro/login, multiempresa, histórico) continua existindo exatamente como está, só deixa de ser obrigatório para o primeiro contato com o produto.

## Contexto

Ao ver a tela de login rodando, o usuário considerou obrigar login/senha como primeira experiência uma falha de visão: "o sistema deveria apenas pedir um site para ele conferir os dados do site, somente isso". Isso tensiona com o que `docs/VISION.md` e `docs/PRODUCT.md` já documentam (SaaS multiempresa, "preparado para milhares de empresas", perfis de usuário, histórico de WriScore por projeto) e com a decisão de arquitetura já registrada em `docs/ARCHITECTURE.md` ("Autenticação: JWT emitido pelo backend").

Duas perguntas de escopo foram feitas e confirmadas com o usuário antes deste design:
1. **Checagem livre, conta só para salvar** (não: produto inteiro sem contas) — a visão multiempresa/histórico do `PRODUCT.md` continua valendo para quem quiser salvar; só deixa de ser a porta de entrada obrigatória.
2. **A checagem livre vira a nova home (`/`)** (não: opção ao lado do login atual).

## Escopo confirmado

- **Dentro do escopo:** endpoint público de checagem (sem persistência), nova home pública no frontend, rate limiting + validação básica de hostname na rota pública, CTA de cadastro após o resultado, atualização de documentação.
- **Fora do escopo desta entrega:** proteção completa contra SSRF (validação do IP resolvido, não só do hostname digitado) — vai para `docs/BACKLOG.md` como pendência explícita, não bloqueia esta entrega.
- **Não muda:** `WriService`, `CompanyService`, `AuthService`, schema Prisma, fluxo autenticado existente (`/login`, `/dashboard`).

## Arquitetura

`runDeterministicAudit` (`backend/src/modules/wri/wri-audit.util.ts`) já é uma função pura/de rede sem dependência de Prisma — não sabe nada sobre `Project`/`Company`/usuário. Isso permite expor a mesma função por uma rota pública nova sem tocar no que já existe.

- **Novo endpoint:** `POST /api/public/wri-check`, sem `JwtAuthGuard`, corpo `{ domain: string }` (DTO com `class-validator`, mesmo padrão dos DTOs existentes), chama `runDeterministicAudit(domain)` direto e devolve `{ domain, score, checks }`.
- **Sem persistência.** Nenhuma escrita em `Project`/`Metric`/`WriScore` — o resultado é calculado e devolvido, não fica salvo em lugar nenhum. Evita inventar um "dono" para dados anônimos (hoje `Project.companyId` é obrigatório) e mantém a regra 7 da Constituição ("todo dado deve possuir origem") intacta: dado anônimo simplesmente não é dado persistido.
- **Controller novo e separado** do `WriController` atual (que continua 100% guardado por `JwtAuthGuard`) — evita misturar rota pública e autenticada na mesma classe. Vive no módulo `wri` (mesma fronteira de domínio), como um controller distinto (ex. `PublicWriController`), registrado no `WriModule` sem `@UseGuards`. `WriModule` continua importando `AuthModule` como hoje — isso não muda —, só que o novo controller simplesmente não usa o guard que esse import disponibiliza.
- `WriService`, `CompanyService`, `AuthService` e o schema Prisma não mudam.

## Segurança

A rota é pública e faz chamadas de rede reais (`fetch`, `tls.connect`) para qualquer domínio informado — sem barreira nenhuma isso é abuso fácil (spam de requisições, ou o servidor sendo usado para sondar endereços internos). Mitigação mínima para esta entrega:

- **Rate limiting por IP** via `@nestjs/throttler` (pacote oficial NestJS — nova dependência, registrada em `docs/STACK.md`/`docs/DECISIONS.md`). Limite inicial: 5 checagens por minuto por IP, aplicado só à rota pública. Ajustável depois sem mudança de arquitetura.
- **Validação básica de hostname** antes de chamar `fetch`/`tls.connect`: rejeitar IP literal, `localhost`, e padrões claramente internos (regex sobre o hostname informado).
- **Não coberto aqui:** validação do IP *resolvido* (proteção real contra SSRF/DNS rebinding) — registrado em `docs/BACKLOG.md` como pendência explícita de segurança, não implementado nesta entrega.

## Frontend

- `frontend/app/page.tsx` deixa de fazer `redirect('/login')` e passa a renderizar a tela pública: campo de domínio + botão "Analisar".
- Ao enviar: chama `POST /api/public/wri-check` (sem token) via `apiFetch`, mostra estado de carregamento (a auditoria real demora alguns segundos — chamadas de rede de verdade), depois o score e a lista dos 14 checks.
- A lista de checks (score + breakdown) é extraída para um componente pequeno compartilhado (ex. `frontend/components/wri-score-breakdown.tsx`) e reaproveitada tanto na home pública quanto no dashboard autenticado — hoje esse JSX só existe inline em `dashboard/page.tsx`; duplicar seria contra a regra do `CLAUDE.md` de não gerar código duplicado.
- Abaixo do resultado, CTA: "Crie uma conta para salvar esse resultado e acompanhar ao longo do tempo" → leva para `/login` em modo cadastro.
- `/login` continua existindo e funcionando exatamente como hoje, só deixa de ser a rota raiz.

## Tratamento de erros

- Domínio inválido/vazio: validação client-side (campo obrigatório) + `class-validator` no DTO do backend.
- Domínio que falha ao responder (timeout, DNS inexistente etc.): `runDeterministicAudit` já lida com isso hoje (marca `reachable: 0`, segue calculando os outros checks) — mesmo comportamento da rota autenticada, sem tratamento especial novo.
- Rate limit excedido: `@nestjs/throttler` devolve `429 Too Many Requests` por padrão; frontend mostra mensagem simples ("Muitas checagens em pouco tempo, tente novamente em instantes").

## Testes

Mesmo padrão já estabelecido nesta sessão (Jest no backend, Vitest no frontend, escopo unitário):

- Backend (Jest): novo `public-wri.controller.spec.ts` (ou equivalente) mockando `runDeterministicAudit` — sem rede real, cobrindo o caminho de sucesso e domínio inválido. Se o rate limiting for testado, mock do `ThrottlerGuard` ou teste de integração leve — decidir no plano de implementação.
- Frontend (Vitest): novo `app/page.test.tsx` cobrindo digitar domínio → ver score → CTA de cadastro visível, com `apiFetch` mockado (mesmo padrão de `login/page.test.tsx`/`dashboard/page.test.tsx`).

## Documentação a atualizar

- `docs/DECISIONS.md`: nova entrada — login deixa de ser porta de entrada obrigatória; checagem pública sem persistência; rate limiting como mitigação mínima; SSRF completo adiado para o backlog.
- `docs/VISION.md` / `docs/PRODUCT.md`: descrever o fluxo público (checagem sem conta) coexistindo com o fluxo autenticado (multiempresa/histórico), já que hoje só o segundo está documentado.
- `docs/ARCHITECTURE.md`: nova rota pública documentada ao lado da autenticação JWT existente.
- `docs/STACK.md`: `@nestjs/throttler` como nova dependência.
- `docs/MASTER_CHECKLIST.md`: item novo.
- `docs/BACKLOG.md`: pendência de SSRF completo (validação do IP resolvido).
- `docs/roadmap.html`: regenerado ao final, após verificação (mesmo ciclo já seguido nesta sessão — `roadmap-verifier` antes de mexer no dashboard).

## Critérios de aceite

- `POST /api/public/wri-check` funciona sem token, não persiste nada no banco, respeita rate limit de 5/min/IP, rejeita hostnames obviamente internos.
- `/` mostra a tela de checagem pública (não redireciona mais para `/login`); `/login` continua acessível e funcional.
- Resultado da checagem pública mostra score + breakdown dos 14 checks, com CTA de cadastro.
- Todos os testes novos e existentes passam (`npm test` na raiz); `tsc --noEmit` limpo nos dois projetos.
