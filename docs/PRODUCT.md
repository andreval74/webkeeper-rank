# PRODUCT.md

## Objetivo

Descrever o produto WebKeeper Rank: perfis de usuário, entidades centrais, estrutura do índice WRI, tipos de recomendação e níveis de automação.

## Responsabilidades

Este documento é a fonte de verdade sobre **o que o produto faz e para quem**. Decisões de arquitetura técnica ficam em `ARCHITECTURE.md`.

## Perfis de usuário

- **Administrador** — controle total da plataforma.
- **Consultor** — atua em nome de uma ou mais empresas/agências.
- **Agência** — gerencia múltiplas empresas clientes.
- **Empresa** — dono do domínio/projeto analisado.
- **Cliente Final** — visão restrita, geralmente somente leitura.
- **Equipe** — membros internos de uma empresa/agência com permissões específicas.
- **IA (Agente)** — atua de forma autônoma ou assistida dentro dos limites definidos por `AI_AGENTS.md` (pendente).

## Entidades centrais

`Empresa`, `Projeto`, `Domínio`, `Página`, `Palavra-chave`, `Canal Digital`, `Auditoria`, `Relatório`, `Métrica`, `Recomendação`, `Automação`, `Agente IA`, `Usuário`, `Equipe`.

> O schema Prisma inicial (`backend/prisma/schema.prisma`) implementa um subconjunto mínimo: `User`, `Company`, `Project`, `Metric`, `WriScore`. As demais entidades serão adicionadas incrementalmente — ver `docs/MASTER_CHECKLIST.md`.

## Níveis do WRI (WebKeeper Rank Index)

```
WRI
├── SEO
├── GEO
├── AEO
├── Brand
├── Authority
├── Performance
├── UX
├── Reputation
├── Social
├── Local
├── Security
├── Conversion
```

Cada categoria possui dezenas de métricas próprias. Na implementação inicial (hoje), calculamos um subconjunto mínimo e determinístico dentro de **Performance** e **Security** (ex.: uso de HTTPS, presença de meta tags essenciais) para validar o fluxo ponta a ponta. As demais categorias entram progressivamente.

## Tipos de recomendação

A IA não apenas responde — ela classifica as ações:

- Crítico
- Alta prioridade
- Média prioridade
- Baixa prioridade
- Oportunidade
- Automatizável
- Monitoramento

## Níveis de automação

- Manual
- Assistido
- Semi-automático
- Automático
- Autônomo

Cada funcionalidade deve declarar explicitamente até qual nível de automação está autorizada a agir.

## Fluxo mínimo (implementado hoje)

1. Usuário se registra/loga.
2. Usuário cria uma Empresa e um Projeto (domínio).
3. Sistema executa uma auditoria mínima determinística sobre o domínio informado.
4. Sistema calcula um `WriScore` inicial e grava a métrica.
5. Dashboard exibe o score e as métricas que o compõem.

## Decisões

- 2026-07-17: Escopo inicial do WRI restrito a métricas determinísticas (sem LLM) para viabilizar entrega no primeiro dia. Ver `docs/DECISIONS.md`.

## Pendências

- Detalhar fórmula de ponderação entre categorias do WRI.
- Definir `RULES.md` (regras de negócio), `AI_AGENTS.md` e `UX_UI.md`.

## Roadmap

Ver [docs/MASTER_CHECKLIST.md](MASTER_CHECKLIST.md).
