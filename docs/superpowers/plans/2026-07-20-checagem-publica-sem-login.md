# Checagem Pública Sem Login — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A home (`/`) do WebKeeper Rank vira uma checagem pública de site (sem login) — o usuário digita um domínio e recebe o WriScore na hora; o fluxo autenticado existente (login, multiempresa, histórico) continua funcionando exatamente como está, só deixa de ser a porta de entrada.

**Architecture:** Novo endpoint `POST /api/public/wri-check`, sem `JwtAuthGuard`, num controller separado do `WriController` guardado — chama `runDeterministicAudit` (já existente, sem dependência de Prisma) direto e devolve o resultado sem persistir nada. Protegido por rate limiting (`@nestjs/throttler`) e validação básica de hostname. `frontend/app/page.tsx` deixa de redirecionar para `/login` e vira essa tela; um componente `WriScoreBreakdown` é extraído do dashboard para reaproveitar a exibição do score/breakdown nas duas telas sem duplicar JSX.

**Tech Stack:** NestJS + Fastify + `@nestjs/throttler` (novo) no backend; Next.js 16 App Router + React 19 no frontend; Jest (backend) e Vitest (frontend) para os testes novos, seguindo exatamente os padrões já estabelecidos nesta sessão.

## Global Constraints

- Sem persistência: a checagem pública nunca escreve em `Project`/`Metric`/`WriScore` — spec, seção Arquitetura.
- Rate limit: 5 requisições por minuto por IP, escopado só à rota pública (não global) — spec, seção Segurança.
- `@nestjs/throttler` versão `^6.5.0` (confirmada compatível com `@nestjs/core ^11.0.0` já usado no projeto).
- Validação de hostname rejeita: IP literal (IPv4), `localhost`/`*.localhost`, hostnames sem TLD (label único), sufixos reservados (`.local`, `.internal`, `.test`, `.example`, `.invalid`). Proteção completa contra SSRF (validar o IP resolvido) fica fora de escopo — vira item em `docs/BACKLOG.md`.
- Testes novos de lógica pura no backend vão para Jest (`.spec.ts`), **não** para `node:test` — o `node:test` fica congelado só no arquivo pré-existente `wri-audit.util.test.ts`, decisão já tomada nesta sessão para os testes automatizados.
- Frontend: mockar `apiFetch` diretamente (não `fetch` global), mesmo padrão de `login/page.test.tsx`/`dashboard/page.test.tsx`.
- Todo texto voltado ao usuário (labels, mensagens de erro, commits, docs) em português, seguindo o resto do projeto.
- **Commits:** os passos de commit abaixo seguem o formato padrão do plano, mas **não devem ser executados sem confirmação explícita do usuário antes do primeiro commit** — regra do operador (nunca commitar sem pedido explícito), não do projeto. Ao executar este plano, pergunte antes de rodar o primeiro `git commit`.

---

### Task 1: Validador de hostname para a rota pública

**Files:**
- Create: `backend/src/modules/wri/public-domain-guard.util.ts`
- Test: `backend/src/modules/wri/public-domain-guard.util.spec.ts`

**Interfaces:**
- Produces: `isPubliclyRoutableHostname(rawInput: string): boolean` — usado pela Task 2.

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/src/modules/wri/public-domain-guard.util.spec.ts`:

```ts
import { isPubliclyRoutableHostname } from './public-domain-guard.util';

describe('isPubliclyRoutableHostname', () => {
  it('aceita um domínio público comum', () => {
    expect(isPubliclyRoutableHostname('acme.com')).toBe(true);
  });

  it('aceita um domínio já com prefixo https://', () => {
    expect(isPubliclyRoutableHostname('https://acme.com.br')).toBe(true);
  });

  it('rejeita um IPv4 literal', () => {
    expect(isPubliclyRoutableHostname('127.0.0.1')).toBe(false);
  });

  it('rejeita "localhost"', () => {
    expect(isPubliclyRoutableHostname('localhost')).toBe(false);
  });

  it('rejeita hostname sem TLD (label único)', () => {
    expect(isPubliclyRoutableHostname('internal-service')).toBe(false);
  });

  it('rejeita string que não é uma URL válida', () => {
    expect(isPubliclyRoutableHostname('http://')).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test --workspace=backend`
Expected: FALHA — `Cannot find module './public-domain-guard.util'` (o arquivo de implementação ainda não existe).

- [ ] **Step 3: Implementação mínima**

Criar `backend/src/modules/wri/public-domain-guard.util.ts`:

```ts
const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
const RESERVED_HOSTNAMES = new Set(['localhost']);
const RESERVED_SUFFIXES = ['.localhost', '.local', '.internal', '.test', '.example', '.invalid'];

function extractHostname(rawInput: string): string | null {
  const withScheme =
    rawInput.startsWith('http://') || rawInput.startsWith('https://')
      ? rawInput
      : `https://${rawInput}`;
  try {
    return new URL(withScheme).hostname;
  } catch {
    return null;
  }
}

export function isPubliclyRoutableHostname(rawInput: string): boolean {
  const hostname = extractHostname(rawInput);
  if (!hostname) return false;

  const lower = hostname.toLowerCase();

  if (RESERVED_HOSTNAMES.has(lower)) return false;
  if (RESERVED_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return false;
  if (IPV4_PATTERN.test(lower)) return false;
  if (lower.includes(':')) return false;
  if (!lower.includes('.')) return false;

  return true;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test --workspace=backend`
Expected: `Test Suites: 4 passed, 4 total` / `Tests: 18 passed, 18 total`

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/wri/public-domain-guard.util.ts backend/src/modules/wri/public-domain-guard.util.spec.ts
git commit -m "feat(wri): validador de hostname para checagem pública"
```

---

### Task 2: Endpoint público `POST /api/public/wri-check`

**Files:**
- Create: `backend/src/modules/wri/dto/check-domain.dto.ts`
- Create: `backend/src/modules/wri/public-wri.controller.ts`
- Test: `backend/src/modules/wri/public-wri.controller.spec.ts`

**Interfaces:**
- Consumes: `isPubliclyRoutableHostname` (Task 1); `runDeterministicAudit` de `./wri-audit.util` (já existe).
- Produces: classe `PublicWriController` com método `check(dto: CheckDomainDto)`, usada pela Task 3 (`WriModule`).

- [ ] **Step 1: Instalar a dependência**

Run: `npm install @nestjs/throttler@^6.5.0 --workspace=backend`
Expected: instala sem erro (peer de `@nestjs/core`/`@nestjs/common` `^11.0.0` já compatível).

- [ ] **Step 2: Escrever o teste que falha**

Criar `backend/src/modules/wri/public-wri.controller.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { PublicWriController } from './public-wri.controller';
import { runDeterministicAudit } from './wri-audit.util';

jest.mock('./wri-audit.util');
const mockedRunAudit = runDeterministicAudit as jest.MockedFunction<typeof runDeterministicAudit>;

describe('PublicWriController', () => {
  let controller: PublicWriController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PublicWriController();
  });

  it('roda a auditoria e devolve o resultado para um domínio válido', async () => {
    const audit = {
      domain: 'acme.com',
      score: 70,
      checks: [{ category: 'Security' as const, key: 'https', value: 1, weight: 30 }],
    };
    mockedRunAudit.mockResolvedValue(audit);

    const result = await controller.check({ domain: 'acme.com' });

    expect(mockedRunAudit).toHaveBeenCalledWith('acme.com');
    expect(result).toBe(audit);
  });

  it('rejeita domínio interno sem chamar a auditoria', async () => {
    await expect(controller.check({ domain: 'localhost' })).rejects.toThrow(BadRequestException);
    expect(mockedRunAudit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npm test --workspace=backend`
Expected: FALHA — `Cannot find module './public-wri.controller'`.

- [ ] **Step 4: Implementação mínima**

Criar `backend/src/modules/wri/dto/check-domain.dto.ts`:

```ts
import { IsString, MinLength } from 'class-validator';

export class CheckDomainDto {
  @IsString()
  @MinLength(3)
  domain!: string;
}
```

Criar `backend/src/modules/wri/public-wri.controller.ts`:

```ts
import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CheckDomainDto } from './dto/check-domain.dto';
import { isPubliclyRoutableHostname } from './public-domain-guard.util';
import { runDeterministicAudit } from './wri-audit.util';

@UseGuards(ThrottlerGuard)
@Controller('public/wri-check')
export class PublicWriController {
  @Post()
  async check(@Body() dto: CheckDomainDto) {
    if (!isPubliclyRoutableHostname(dto.domain)) {
      throw new BadRequestException('Domínio inválido para checagem pública');
    }
    return runDeterministicAudit(dto.domain);
  }
}
```

O `@Body()` é um decorator de parâmetro do Nest — só tem efeito quando a requisição passa pelo framework (Task 3, via `curl`); não afeta a chamada direta `controller.check({ domain: ... })` do teste unitário acima.

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npm test --workspace=backend`
Expected: `Test Suites: 5 passed, 5 total` / `Tests: 20 passed, 20 total`

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/wri/dto/check-domain.dto.ts backend/src/modules/wri/public-wri.controller.ts backend/src/modules/wri/public-wri.controller.spec.ts backend/package.json backend/package-lock.json
git commit -m "feat(wri): endpoint público POST /api/public/wri-check"
```

---

### Task 3: Registrar a rota pública no `WriModule`

**Files:**
- Modify: `backend/src/modules/wri/wri.module.ts`

**Interfaces:**
- Consumes: `PublicWriController` (Task 2), `ThrottlerModule`/`ThrottlerGuard` de `@nestjs/throttler`.
- Produces: rota `POST /api/public/wri-check` de fato acessível pelo servidor Nest rodando.

- [ ] **Step 1: Editar o módulo**

Substituir o conteúdo de `backend/src/modules/wri/wri.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { WriService } from './wri.service';
import { WriController } from './wri.controller';
import { PublicWriController } from './public-wri.controller';

@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])],
  controllers: [WriController, PublicWriController],
  providers: [WriService, ThrottlerGuard],
})
export class WriModule {}
```

(`ThrottlerGuard` é explicitamente listado em `providers`, mesmo padrão já usado para `JwtAuthGuard` em `backend/src/modules/auth/auth.module.ts:20` — guards resolvidos via `@UseGuards()` precisam estar registrados como provider no módulo que os disponibiliza.)

- [ ] **Step 2: Verificar que o backend recompila sem erro**

O servidor backend já está rodando em modo watch nesta sessão (`nest start --watch`, iniciado antes desta tarefa). Ao salvar o arquivo, ele recompila sozinho.

Run: `npx tsc --noEmit --project backend/tsconfig.json`
Expected: sem erros.

- [ ] **Step 3: Testar a rota de verdade contra o servidor rodando**

Run:
```bash
curl -s -X POST http://localhost:3333/api/public/wri-check \
  -H "Content-Type: application/json" \
  -d '{"domain":"webkeeper.com.br"}'
```
Expected: JSON com `"domain":"webkeeper.com.br"`, `"score"` numérico e array `"checks"` com 14 itens — sem precisar de header `Authorization`.

Run (validação de hostname interno):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3333/api/public/wri-check \
  -H "Content-Type: application/json" \
  -d '{"domain":"localhost"}'
```
Expected: `400`

Run (rate limit — 6 chamadas seguidas, a última deve estourar o limite de 5/min):
```bash
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "chamada $i: %{http_code}\n" -X POST http://localhost:3333/api/public/wri-check \
    -H "Content-Type: application/json" \
    -d '{"domain":"example.com"}'
done
```
Expected: chamadas 1–5 retornam `201` (ou `200`, conforme o Nest padroniza POST sem `@HttpCode`), a chamada 6 retorna `429`.

- [ ] **Step 4: Rodar a suíte completa do backend**

Run: `npm run test:all --workspace=backend`
Expected: Jest `5 passed, 5 total` suites / `20 passed, 20 total` testes; `node:test` `pass 7 / fail 0` (inalterado).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/wri/wri.module.ts
git commit -m "feat(wri): registrar rota pública de checagem no WriModule"
```

---

### Task 4: Extrair `WriScoreBreakdown` e reaproveitar no dashboard

**Files:**
- Create: `frontend/components/wri-score-breakdown.tsx`
- Modify: `frontend/app/dashboard/page.tsx`

**Interfaces:**
- Produces: componente `WriScoreBreakdown({ score, checks }: { score: number; checks: Array<{ category: string; key: string; value: number; weight: number }> })`, de `@/components/wri-score-breakdown` — usado pela Task 5 também.

- [ ] **Step 1: Criar o componente**

Criar `frontend/components/wri-score-breakdown.tsx`:

```tsx
interface WriCheckItem {
  category: string;
  key: string;
  value: number;
  weight: number;
}

interface WriScoreBreakdownProps {
  score: number;
  checks: WriCheckItem[];
}

export function WriScoreBreakdown({ score, checks }: WriScoreBreakdownProps) {
  return (
    <div>
      <p className="mb-3 text-4xl font-bold text-[var(--wk-primary)]">
        {score}
        <span className="text-base font-normal text-white/50">/100</span>
      </p>
      <ul className="space-y-1 text-sm text-white/70">
        {checks.map((check) => (
          <li key={`${check.category}-${check.key}`}>
            [{check.category}] {check.key}: {check.value ? '✅' : '❌'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Reaproveitar no dashboard**

Em `frontend/app/dashboard/page.tsx`, adicionar o import junto aos demais (perto da linha 6, após `import { apiFetch } from '@/lib/api';`):

```ts
import { WriScoreBreakdown } from '@/components/wri-score-breakdown';
```

Substituir o bloco (dentro do JSX, onde hoje está):

```tsx
          {scoreQuery.data ? (
            <div>
              <p className="mb-3 text-4xl font-bold text-[var(--wk-primary)]">
                {scoreQuery.data.score}
                <span className="text-base font-normal text-white/50">/100</span>
              </p>
              <ul className="space-y-1 text-sm text-white/70">
                {scoreQuery.data.breakdown?.map((check) => (
                  <li key={`${check.category}-${check.key}`}>
                    [{check.category}] {check.key}: {check.value ? '✅' : '❌'}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-white/60">Nenhuma auditoria rodada ainda.</p>
          )}
```

por:

```tsx
          {scoreQuery.data ? (
            <WriScoreBreakdown score={scoreQuery.data.score} checks={scoreQuery.data.breakdown} />
          ) : (
            <p className="text-sm text-white/60">Nenhuma auditoria rodada ainda.</p>
          )}
```

- [ ] **Step 3: Confirmar que a suíte existente do dashboard continua passando sem alteração**

O componente extraído renderiza exatamente o mesmo HTML de antes — nenhuma asserção de `dashboard/page.test.tsx` deveria precisar mudar.

Run: `npm test --workspace=frontend`
Expected: `Test Files 2 passed (2)` / `Tests 5 passed (5)` — igual ao que já passava antes desta task.

- [ ] **Step 4: Checar tipos**

Run: `npx tsc --noEmit --project frontend/tsconfig.json`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/wri-score-breakdown.tsx frontend/app/dashboard/page.tsx
git commit -m "refactor(frontend): extrair WriScoreBreakdown do dashboard"
```

---

### Task 5: Nova home pública de checagem

**Files:**
- Modify: `frontend/app/page.tsx`
- Test: `frontend/app/page.test.tsx`

**Interfaces:**
- Consumes: `WriScoreBreakdown` (Task 4), `apiFetch` de `@/lib/api` (já existe).
- Produces: comportamento da rota `/` (a nova tela pública).

- [ ] **Step 1: Escrever o teste que falha**

Criar `frontend/app/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '@/lib/api';
import HomePage from './page';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

describe('HomePage', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it('roda a checagem e mostra o score com o CTA de cadastro', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      domain: 'acme.com',
      score: 83,
      checks: [{ category: 'Security', key: 'https', value: 1, weight: 4.29 }],
    });
    render(<HomePage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('dominio.com.br'), 'acme.com');
    await user.click(screen.getByRole('button', { name: 'Analisar' }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/public/wri-check', {
        method: 'POST',
        body: JSON.stringify({ domain: 'acme.com' }),
      });
    });
    expect(await screen.findByText('83')).toBeInTheDocument();
    expect(screen.getByText('Criar conta')).toBeInTheDocument();
  });

  it('mostra a mensagem de rate limit quando o backend recusa por excesso de checagens', async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error('ThrottlerException: Too Many Requests'));
    render(<HomePage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('dominio.com.br'), 'acme.com');
    await user.click(screen.getByRole('button', { name: 'Analisar' }));

    expect(
      await screen.findByText('Muitas checagens em pouco tempo, tente novamente em instantes.'),
    ).toBeInTheDocument();
  });

  it('mostra a mensagem de erro do backend para domínio inválido', async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error('Domínio inválido para checagem pública'));
    render(<HomePage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('dominio.com.br'), 'localhost');
    await user.click(screen.getByRole('button', { name: 'Analisar' }));

    expect(await screen.findByText('Domínio inválido para checagem pública')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test --workspace=frontend`
Expected: FALHA — a página atual (`redirect('/login')`) não renderiza nenhum dos elementos esperados (`getByPlaceholderText('dominio.com.br')` não encontrado).

- [ ] **Step 3: Implementação**

Substituir todo o conteúdo de `frontend/app/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { WriScoreBreakdown } from '@/components/wri-score-breakdown';

interface PublicCheckResult {
  domain: string;
  score: number;
  checks: Array<{ category: string; key: string; value: number; weight: number }>;
}

const RATE_LIMIT_MESSAGE = 'Muitas checagens em pouco tempo, tente novamente em instantes.';

export default function HomePage() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<PublicCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const data = await apiFetch<PublicCheckResult>('/public/wri-check', {
        method: 'POST',
        body: JSON.stringify({ domain }),
      });
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message.includes('ThrottlerException') ? RATE_LIMIT_MESSAGE : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">WebKeeper Rank</h1>
      <p className="mb-6 text-sm text-white/60">Digite um site e veja o WRI Score na hora</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <input
          className="mb-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-[var(--wk-primary)]"
          placeholder="dominio.com.br"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading || !domain}
          className="mb-4 w-full rounded-lg bg-[var(--wk-primary)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Analisando...' : 'Analisar'}
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[var(--wk-surface)] p-6">
          <WriScoreBreakdown score={result.score} checks={result.checks} />
          <div className="mt-4 border-t border-white/10 pt-4 text-center">
            <p className="mb-2 text-sm text-white/70">
              Crie uma conta para salvar esse resultado e acompanhar ao longo do tempo
            </p>
            <a href="/login" className="text-sm font-medium text-[var(--wk-primary)] hover:underline">
              Criar conta
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test --workspace=frontend`
Expected: `Test Files 3 passed (3)` / `Tests 8 passed (8)`

- [ ] **Step 5: Checar tipos**

Run: `npx tsc --noEmit --project frontend/tsconfig.json`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/page.tsx frontend/app/page.test.tsx
git commit -m "feat(frontend): home vira checagem pública sem login"
```

---

### Task 6: Atualizar documentação do produto

**Files:**
- Modify: `docs/VISION.md`
- Modify: `docs/PRODUCT.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/STACK.md`
- Modify: `docs/DECISIONS.md`
- Modify: `docs/MASTER_CHECKLIST.md`
- Modify: `docs/BACKLOG.md`

**Interfaces:** nenhuma (só documentação, sem código).

- [ ] **Step 1: `docs/VISION.md`**

Inserir depois do parágrafo de "## Visão" (depois da linha que termina em "...outros canais digitais."), antes de "## Pilares do produto":

```markdown

A porta de entrada do produto é uma checagem pública e imediata (sem conta) — qualquer pessoa digita um domínio e recebe o WRI Score na hora. Contas continuam existindo para quem quer salvar histórico, gerenciar múltiplas empresas/projetos e acessar os demais níveis do WRI descritos em [PRODUCT.md](PRODUCT.md).
```

Adicionar em "## Decisões":

```markdown
- 2026-07-20: checagem pública sem login vira a porta de entrada do produto; contas continuam existindo para salvar histórico e gerenciar multiempresa. Ver `docs/DECISIONS.md`.
```

- [ ] **Step 2: `docs/PRODUCT.md`**

Substituir a seção `## Fluxo mínimo (implementado hoje)` inteira por:

```markdown
## Fluxo mínimo (implementado hoje)

**Checagem pública (porta de entrada, sem conta):**

1. Usuário digita um domínio na home (`/`).
2. Sistema executa a auditoria determinística sobre o domínio informado, na hora, sem persistir nada.
3. Resultado (score + breakdown) é exibido imediatamente, com um convite para criar conta e salvar o resultado.

**Fluxo autenticado (para salvar histórico e gerenciar multiempresa):**

4. Usuário se registra/loga.
5. Usuário cria uma Empresa e um Projeto (domínio).
6. Sistema executa a mesma auditoria determinística, agora persistindo `Metric`/`WriScore` vinculados ao projeto.
7. Dashboard exibe o score, o histórico e as métricas que o compõem.
```

Adicionar em "## Decisões":

```markdown
- 2026-07-20: checagem pública sem login adicionada como porta de entrada; fluxo autenticado (multiempresa/histórico) continua existindo para quem quer salvar. Ver `docs/DECISIONS.md`.
```

- [ ] **Step 3: `docs/ARCHITECTURE.md`**

Adicionar novo bullet em "## Visão geral", logo depois do bullet "**Autenticação.**":

```markdown
- **Checagem pública.** Rota `POST /api/public/wri-check`, sem autenticação, sem persistência — roda a mesma auditoria determinística e devolve o resultado na hora. Protegida por rate limiting (`@nestjs/throttler`, 5 requisições/minuto/IP) e validação básica de hostname (rejeita IP literal, `localhost`, hostnames sem TLD). Proteção completa contra SSRF (validação do IP resolvido) fica pendente — ver `docs/BACKLOG.md`.
```

Adicionar em "## Decisões":

```markdown
- 2026-07-20: checagem pública sem login adicionada (`POST /api/public/wri-check`), com rate limiting e validação básica de hostname como mitigação mínima; SSRF completo adiado. Ver `docs/DECISIONS.md`.
```

- [ ] **Step 4: `docs/STACK.md`**

No bloco `## Backend`, adicionar como último item da lista:

```markdown
- @nestjs/throttler — rate limiting para rotas públicas (ex. checagem sem login)
```

Adicionar em "## Decisões":

```markdown
- 2026-07-20: @nestjs/throttler adicionado para rate limiting da rota pública de checagem. Ver `docs/DECISIONS.md`.
```

- [ ] **Step 5: `docs/DECISIONS.md`**

Adicionar nova entrada ao final do arquivo:

```markdown

## 2026-07-20 — Checagem pública sem login vira a porta de entrada do produto

**Decisão:** a home (`/`) deixa de redirecionar para `/login` e passa a ser uma checagem pública de site — qualquer pessoa digita um domínio e recebe o WriScore na hora, sem conta e sem persistência no banco. O fluxo autenticado (registro/login, multiempresa, histórico de WriScore) continua existindo exatamente como está, só deixa de ser a primeira tela. Endpoint novo: `POST /api/public/wri-check`, sem `JwtAuthGuard`, protegido por rate limiting (`@nestjs/throttler`, 5 requisições/minuto/IP, escopado só a essa rota) e validação básica de hostname (rejeita IP literal, `localhost`, hostnames sem TLD). Proteção completa contra SSRF (validar o IP resolvido, não só o hostname) fica registrada como pendência em `docs/BACKLOG.md`, não bloqueia esta entrega.

**Motivo:** o usuário considerou obrigar login/senha como primeira experiência uma falha de visão do produto. Confirmado via `AskUserQuestion` que a intenção é a checagem virar a porta de entrada livre, mantendo contas para quem quer salvar histórico e gerenciar multiempresa — não a remoção completa de contas do produto (regra "na dúvida, pergunte" do `CLAUDE.md`). Rate limiting é necessário porque a rota pública dispara chamadas de rede reais (`fetch`, `tls.connect`) para qualquer domínio informado, sem barreira de autenticação — sem mitigação isso é abuso fácil (Constituição, princípio "Security by Design").

**Impacto:** `frontend/app/page.tsx` deixa de redirecionar e vira a tela pública; `frontend/app/dashboard/page.tsx` reaproveita um componente novo (`WriScoreBreakdown`) extraído para não duplicar a exibição do score. Backend ganha `PublicWriController` e `public-domain-guard.util.ts` no módulo `wri`, mais a dependência `@nestjs/throttler`. Nenhuma mudança em `WriService`, `CompanyService`, `AuthService` ou no schema Prisma. `docs/VISION.md`, `docs/PRODUCT.md` e `docs/ARCHITECTURE.md` atualizados para descrever os dois fluxos (público e autenticado) coexistindo.
```

- [ ] **Step 6: `docs/MASTER_CHECKLIST.md`**

No bloco `## Backend`, adicionar:

```markdown
- [x] Rota pública de checagem (sem login), com rate limiting e validação de hostname
```

No bloco `## Frontend`, adicionar:

```markdown
- [x] Home pública de checagem de site (sem login), com CTA para criar conta
```

- [ ] **Step 7: `docs/BACKLOG.md`**

Adicionar nova seção ao final do arquivo:

```markdown

## Segurança

- Proteção completa contra SSRF na checagem pública (`POST /api/public/wri-check`): hoje só valida o hostname informado (regex básica); falta validar o IP para o qual o hostname resolve antes de chamar `fetch`/`tls.connect`, para cobrir DNS rebinding e hostnames que resolvem para endereços internos (RFC 1918, loopback, link-local). Ver `docs/DECISIONS.md`, entrada de 2026-07-20.
```

- [ ] **Step 8: Commit**

```bash
git add docs/VISION.md docs/PRODUCT.md docs/ARCHITECTURE.md docs/STACK.md docs/DECISIONS.md docs/MASTER_CHECKLIST.md docs/BACKLOG.md
git commit -m "docs: documentar checagem pública sem login"
```

---

### Task 7: Verificação final de ponta a ponta

**Files:** nenhum arquivo novo — só validação.

**Interfaces:** nenhuma.

- [ ] **Step 1: Suíte completa**

Run: `npm test` (raiz)
Expected: backend Jest `5 passed, 5 total` suites / `20 passed, 20 total` testes; backend `node:test` `pass 7 / fail 0`; frontend Vitest `Test Files 3 passed (3)` / `Tests 8 passed (8)`.

- [ ] **Step 2: Tipos**

Run:
```bash
npx tsc --noEmit --project backend/tsconfig.json
npx tsc --noEmit --project frontend/tsconfig.json
```
Expected: ambos sem erro.

- [ ] **Step 3: Checagem manual no navegador**

Com os servidores de dev já rodando (`npm run dev:backend`, `npm run dev:frontend`), abrir `http://localhost:3000/` — deve mostrar a tela de checagem pública, não mais um redirect para `/login`. Digitar `webkeeper.com.br`, clicar em "Analisar", confirmar que aparece o score e o CTA "Criar conta". Clicar em "Criar conta" e confirmar que leva para `/login`.

- [ ] **Step 4: Próximo passo (fora deste plano)**

Depois que tudo acima estiver verde, seguir o ciclo já estabelecido no projeto: rodar o subagente `roadmap-verifier` e, só depois de aprovado, atualizar `docs/roadmap.html` e `docs/EXECUTION_LOG.md` — mesmo padrão usado nas entregas anteriores desta sessão. Isso não faz parte deste plano de implementação.
