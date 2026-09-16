# Casa Flor

Sistema de gerenciamento para república de estudantes. Organiza tarefas domésticas, escala de limpeza, avisos, reclamações, financeiro compartilhado e aniversários das moradoras.

## Funcionalidades

- **Escala de tarefas** — rodízio automático mensal com marcação de conclusão por dia
- **Avisos** — admin publica, moradoras confirmam leitura
- **Reclamações** — com categoria, opção anônima e resposta da admin
- **Financeiro** — registro de compras e despesas compartilhadas (aluguel, gás, mercado)
- **Mural de aniversários** — fotos em estilo polaroid, chuva de pétalas no aniversário do dia
- **Calendário** — escala visual com cores por moradora
- **Dois perfis** — Administradora e Moradora, com permissões separadas

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- [NextAuth v4](https://next-auth.js.org/) com JWT
- [TailwindCSS](https://tailwindcss.com/)
- TypeScript

## Pré-requisitos

- Node.js 18+
- Docker (para o banco local)

## Rodando localmente

```bash
# 1. Sobe o banco
docker compose up -d

# 2. Instala dependências
npm install

# 3. Cria as tabelas e o usuário admin inicial
npm run db:push
npm run db:seed

# 4. Inicia o servidor
npm run dev
```

Acesse em `http://localhost:3000`. As credenciais do admin inicial ficam no `.env` (variáveis `SEED_ADMIN_EMAIL` e `SEED_ADMIN_SENHA`).

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=   # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
SEED_ADMIN_NOME=
SEED_ADMIN_EMAIL=
SEED_ADMIN_SENHA=
```

## Scripts úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:push` | Sincroniza schema com o banco |
| `npm run db:seed` | Cria usuário admin inicial |
| `npm run db:reset` | Reseta banco e recria (apaga tudo) |
| `npm run prisma:studio` | Abre GUI do banco |

## Deploy

Feito para rodar na [Vercel](https://vercel.com/) com banco PostgreSQL externo (Neon, Supabase ou Railway). Configure as variáveis de ambiente no painel da Vercel antes do primeiro deploy.

## Estrutura do projeto

```
app/
  (auth)/          # login, esqueci-senha
  (dashboard)/
    admin/         # painel da administradora
    moradora/      # painel das moradoras
  api/             # API routes (Next.js)
components/
  layout/          # Navbar, Sidebar, BottomNav
  modules/         # Calendário, Mural de Aniversariantes
  ui/              # Button, Card, Modal, Badge...
  ui/floral/       # Componentes decorativos temáticos
lib/               # auth, prisma, escala, ocorrências, cores
prisma/
  schema.prisma
  seed.ts
```
