# AEO Module — Answer Engine Optimization

Implementação da categoria **AEO (Answer Engine Optimization)** para o WebKeeper Rank, segunda categoria WRI completa após GEO.

## Objetivo

Auditoria determinística e rastreável de otimização para motores de resposta (como Claude, ChatGPT, Perplexity, etc.), focando na estrutura de conteúdo que facilita a extração de respostas diretas por IA.

## Verificações (8)

1. **Snippet Optimization** — validação de meta description + parágrafos estruturados
2. **Answer Box Eligibility** — presença de cabeçalhos + estrutura de resposta direta
3. **Featured Snippet Preparation** — listas/tabelas bem formadas
4. **Table/List Structure** — verificação de markup HTML semântico (ul/ol, table com th/td)
5. **Inline Code Examples** — presença de blocos de código (<code>, <pre>)
6. **Definition Clarity** — definições com dl/dt/dd ou bold + emphasis
7. **FAQ Schema** — marcação JSON-LD para FAQPage
8. **Passage Relevance** — conteúdo >300 palavras com palavras-chave destacadas

## Pontuação

- Total: 100 pontos distribuídos igualmente (12.5 pts cada)
- Cada check é binário: 0 (falha) ou 1 (passa)
- Score final = (checks passando / total de checks) × 100

## Endpoints

### Autenticado (JWT)

```
POST /projects/:projectId/aeo/audit
GET /projects/:projectId/aeo/latest
```

### Público (Rate-limited)

```
POST /public/aeo-check
Body: { "domain": "example.com" }
```

## Arquitetura

```
aeo/
├── aeo-audit.util.ts       # Lógica pura de auditoria (8 checks)
├── aeo-audit.util.test.ts  # node:test (11 testes, zero deps)
├── aeo.service.ts          # Transação atômica: Metric + AeoScore
├── aeo.service.spec.ts     # Jest (4 testes com mocks)
├── aeo.controller.ts       # Endpoints autenticados
├── public-aeo.controller.ts # Endpoints públicos
├── aeo.module.ts           # Registro NestJS + rate limiting
├── dto/
│   └── check-domain.dto.ts # Validação de entrada
├── public-domain-guard.util.ts # Validação SSRF
└── README.md               # Este arquivo
```

## Padrão Replicável

Este módulo segue exatamente o padrão GEO e pode ser replicado para 7 categorias restantes (Brand, Authority, UX, Reputation, Social, Local, Conversion) alterando apenas:

1. Nome das classes: `Aeo*` → `[Category]*`
2. Rotas: `/aeo` → `/[category]`
3. Categoria: `'AEO'` → `'[CATEGORY]'`
4. Os 8 checks específicos do domínio (lógica pura em `.util.ts`)

## Decisões

- **Binário**: checks retornam 0 ou 1 (auditável, simplifica scoring)
- **Determinístico**: sem chamadas a LLM, apenas regex + network fetch + HTML parsing
- **Sem dependências**: `aeo-audit.util.ts` não importa nada além de Node.js nativo
- **Async/await**: fetch com timeout de 8s, trata erros de rede gracefully
- **Migrations**: AeoScore model no Prisma, cascade delete, índices por projectId + categoria + createdAt

## Testes

```bash
npm run test        # Jest: aeo.service.spec.ts (4 testes)
npm run test:node   # node:test: aeo-audit.util.test.ts (11 testes)
npm run test:all    # Ambos (28 Jest + 29 node:test = 57 total)
```

## Próximo

8 categorias restantes seguem o mesmo template. Rotação esperada:
1. AEO ✅ (2026-07-21)
2. Brand (próximo)
3. Authority
4. UX
5. Reputation
6. Social
7. Local
8. Conversion
