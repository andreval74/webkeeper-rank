# BRAND Module — Brand Consistency & Presence

Implementação da categoria **BRAND** para o WebKeeper Rank, terceira categoria WRI completa.

## Objetivo

Auditoria determinística de consistência e força da marca nos canais digitais — logo, cores, tipografia, mensagem, social links, guidelines, favicon, metadata de autor.

## Verificações (8)

1. **Brand Consistency** — logo presente + navegação estruturada
2. **Color Consistency** — CSS definido + variáveis de cor (--primary, --brand, etc)
3. **Typography Consistency** — importação de fontes + cabeçalhos presente
4. **Brand Messaging** — tagline/slogan + about/mission statement
5. **Social Links** — links para redes sociais + footer estruturado
6. **Brand Guidelines** — link ou menção de guideline/styleguide
7. **Favicon Present** — favicon (link rel="icon") detectado
8. **Author Metadata** — meta author ou Organization schema.org

## Pontuação

- Total: 100 pontos distribuídos igualmente (12.5 pts cada)
- Cada check é binário: 0 (falha) ou 1 (passa)
- Score final = (checks passando / total de checks) × 100

## Endpoints

### Autenticado (JWT)

```
POST /projects/:projectId/brand/audit
GET /projects/:projectId/brand/latest
```

### Público (Rate-limited)

```
POST /public/brand-check
Body: { "domain": "example.com" }
```

## Arquitetura

Idêntica a GEO/AEO: 8 arquivos, padrão modular, sem dependências externas no `.util.ts`.

## Próximo

5 categorias restantes: Authority, UX, Reputation, Social, Local, Conversion.
