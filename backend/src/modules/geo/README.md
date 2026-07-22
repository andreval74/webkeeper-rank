# GEO Module

**Generative Engine Optimization** — Auditoria de presença em buscadores generativos (Google Gemini, ChatGPT, Perplexity, etc).

## Descrição

O módulo GEO avalia como uma presença digital está otimizada para **buscadores generativos**, diferente dos buscadores tradicionais (Google, Bing). Buscadores generativos usam IA para resumir e sintetizar informações, e requerem sinais diferentes para rank bem.

## Checks (8 iniciais)

Cada check retorna 0 ou 1 (binário). Os 8 checks são distribuídos com pesos iguais (12.5 pontos cada).

| Check | Descrição |
|-------|-----------|
| `indexed_google_gemini` | Indexação em Knowledge Graph do Google (placeholder para futura API) |
| `featured_in_ai_overview` | Aparição em AI Overviews / ChatGPT search (placeholder para futura API) |
| `schema_org_completeness` | Dados estruturados JSON-LD com ≥3 campos essenciais (name, description, url, image) |
| `openapi_metadata` | Open Graph tags: ≥3 de (og:title, og:description, og:image, og:url) |
| `entity_recognition_tags` | Markup de entidades: links "about" ou rel=author/publisher |
| `knowledge_graph_eligible` | Heurística: schema.org + Open Graph + canonical link (todas as 3) |
| `ai_traffic_signals` | Sinais de tráfego IA: robots meta/x-robots-tag permitem Google-Extended ou Perplexity |
| `content_freshness` | Recência: last-modified header ou dateModified ≤ 7 dias |

## Endpoints

### Autenticado (JWT)

- `POST /projects/:projectId/geo/audit` — Executar auditoria GEO
  - Response: `{ domain, score, checks }`
  - Status: 200 OK ou 404 (projeto não encontrado)

- `GET /projects/:projectId/geo/latest` — Score mais recente
  - Response: `{ id, projectId, category: "GEO", score, breakdown, createdAt, updatedAt }`
  - Status: 200 OK ou null (nenhuma auditoria rodar ainda)

### Público (sem autenticação, rate-limited)

- `POST /public/geo-check` — Checagem pública
  - Request: `{ domain: string }`
  - Response: `{ domain, score, checks }`
  - Status: 200 OK ou 400 (domínio inválido)
  - Rate limit: 5 req/min por IP

## Persistência

Cada auditoria GEO persiste dois tipos de dados:

- **Metric** — Um row por check individual
  - Tabela: `Metric`
  - Campos: `projectId`, `category: "GEO"`, `key` (ex: "schema_org_completeness"), `value` (0 ou 1)
  - Índice: (projectId, category, createdAt)

- **GeoScore** — Um row por auditoria (agregado final)
  - Tabela: `GeoScore`
  - Campos: `projectId`, `category: "GEO"`, `score` (0-100), `breakdown` (JSON dos checks), `createdAt`, `updatedAt`
  - Índice: (projectId, category, createdAt)

## Scoring

1. **Assign Weights**: 100 pontos distribuídos igualmente entre os 8 checks
   - Cada check pesa 100 / 8 = 12.5 pontos

2. **Calculate Score**: Média ponderada
   - `score = (sum(check.value * check.weight) / totalWeight) * 100`
   - Resultado: 0-100, arredondado para inteiro

## Padrão de Replicação

Este módulo estabelece o template para as 9 categorias restantes do WRI:

- **GEO** (atual) — 8 checks iniciais
- **AEO** — Otimização para motores de resposta
- **Brand** — Consistência de marca
- **Authority** — Autoridade e confiança
- **UX** — Experiência do usuário
- **Reputation** — Avaliações e menções
- **Social** — Redes sociais
- **Local** — Mapas e diretórios
- **Conversion** — Elementos de conversão

**Para replicar:**

1. Copie `geo/` inteira para `modules/novo-modulo/`
2. Renomeie classe `GeoService` → `NovoModuloService`, `GeoController` → `NovoModuloController`, etc.
3. Mude `category: 'GEO'` → `category: 'NOVO_MODULO'` em todos os arquivos
4. Adapte os checks específicos para o novo módulo em `novo-modulo-audit.util.ts`
5. Atualize pesos em `CATEGORY_TOTAL` se necessário
6. Adicione novo model no Prisma schema
7. Registre module em `app.module.ts`

## Desenvolvimento

### Rodar testes

```bash
# Jest (service tests)
npm run test -- geo.service.spec.ts

# node:test (util tests, zero-dep)
npm run test:node

# Todos (Jest + node:test)
npm run test:all
```

### Build e lint

```bash
npm run build
npm run lint
```

## Histórico

- **2026-07-21**: Módulo GEO implementado como primeira categoria completa (após WRI/Security/Performance/SEO). 8 checks iniciais, transação atômica Metric + GeoScore, testes (Jest + node:test), documentação.
