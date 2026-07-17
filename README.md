# WebKeeper Rank (WRI)

Plataforma de **Digital Presence Intelligence (DPI)** baseada em Inteligência Artificial: mede, explica, otimiza e automatiza a presença digital de empresas em mecanismos de busca, plataformas de IA, redes sociais, mapas, diretórios e demais canais digitais.

> Veja [docs/VISION.md](docs/VISION.md) e [docs/PRODUCT.md](docs/PRODUCT.md) para a visão completa do produto, e [CLAUDE.md](CLAUDE.md) para as regras de engenharia do projeto.

## Estrutura do monorepo

```
webkeeper-rank/
├── backend/     NestJS + Fastify + Prisma (API)
├── frontend/    Next.js 16 + React 19 (Web App)
├── packages/    Pacotes compartilhados (tipos, DTOs)
├── docs/        Documentação estratégica e técnica
└── scripts/     Scripts de apoio (validação de ambiente, etc.)
```

## Pré-requisitos

- Node.js >= 20 (testado com Node 24)
- Conta [Neon](https://neon.tech) (Postgres gerenciado, free tier)
- Conta [Upstash](https://upstash.com) (Redis gerenciado, free tier) — opcional na fase inicial

## Como rodar localmente

1. Instale as dependências do monorepo:
   ```bash
   npm install
   ```
2. Copie os arquivos de ambiente de exemplo e preencha com suas credenciais:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
3. Valide se todas as variáveis obrigatórias estão preenchidas:
   ```bash
   npm run check-env
   ```
4. Rode as migrations do banco (Prisma contra o Neon):
   ```bash
   npm run --workspace=backend prisma:migrate
   ```
5. Suba o backend e o frontend (em terminais separados):
   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```
6. Acesse `http://localhost:3000`.

## Status do projeto

Consulte [docs/MASTER_CHECKLIST.md](docs/MASTER_CHECKLIST.md) para o que já está pronto e o que falta.

## Licença

MIT — veja [LICENSE](LICENSE).
