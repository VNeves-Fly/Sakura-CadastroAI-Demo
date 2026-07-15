# Cadastro IA Sakura

Plataforma fullstack para cadastro e gerenciamento de informações, construída como um
**monólito modular**, com backend em **Arquitetura Hexagonal** e frontend em **MVVM**.

## Stack

| Camada                   | Tecnologia                      |
| ------------------------ | ------------------------------- |
| Runtime                  | Bun                             |
| Framework                | Next.js 14 (App Router)         |
| Linguagem                | TypeScript                      |
| UI                       | React + TailwindCSS             |
| Estado global (frontend) | Zustand                         |
| Autenticação             | NextAuth (Credentials Provider) |
| ORM                      | Prisma                          |
| Banco de dados           | PostgreSQL                      |
| Validação                | Zod                             |

## Como rodar

### Pré-requisitos

- [Bun](https://bun.sh) 1.3+
- Docker (para o PostgreSQL local)

### Passo a passo

```bash
# 1. Instalar dependências
bun install

# 2. Subir o PostgreSQL
docker compose up -d

# 3. Configurar variáveis de ambiente
cp .env.example .env
# gere um valor forte para NEXTAUTH_SECRET, ex.: openssl rand -base64 32

# 4. Rodar as migrations
bun run db:migrate

# 5. Popular o banco com o usuário de exemplo
bun run db:seed

# 6. Rodar em desenvolvimento
bun run dev
```

Acesse `http://localhost:3000`. O seed cria o usuário `admin@cadastro-ia-sakura.com` / `password123`.

### Scripts disponíveis

| Script                            | Descrição                                       |
| --------------------------------- | ----------------------------------------------- |
| `bun run dev`                     | Sobe o servidor Next.js em modo desenvolvimento |
| `bun run build`                   | Gera o build de produção                        |
| `bun run start`                   | Sobe o servidor a partir do build               |
| `bun run lint` / `lint:fix`       | Executa o ESLint                                |
| `bun run format` / `format:check` | Executa o Prettier                              |
| `bun run typecheck`               | Checa tipos com `tsc --noEmit`                  |
| `bun run db:generate`             | Gera o Prisma Client                            |
| `bun run db:migrate`              | Cria/aplica migrations em desenvolvimento       |
| `bun run db:migrate:deploy`       | Aplica migrations em produção                   |
| `bun run db:seed`                 | Executa o seed inicial                          |
| `bun run db:studio`               | Abre o Prisma Studio                            |
| `bun run db:reset`                | Reseta o banco (drop + migrate + seed)          |

## Arquitetura

O projeto é organizado como um **monólito modular**: cada módulo de negócio
(`auth`, `users`, `cadastro`) é autocontido e não depende diretamente de outros
módulos além de `shared`. Isso mantém baixo acoplamento entre features e permite
que módulos evoluam (ou sejam eventualmente extraídos para serviços) de forma
independente.

```
src/
├── app/                 # App Router: apenas rotas, layouts e composição de páginas
│   ├── (auth)/login/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   └── users/
│   └── dashboard/
├── middleware.ts         # Proteção de rotas via NextAuth
└── modules/
    ├── shared/           # Kernel compartilhado (Result, erros de domínio, Prisma client, HTTP helpers)
    ├── auth/              # Autenticação (login/logout, NextAuth, proteção de sessão)
    ├── users/             # Cadastro/listagem de usuários (exemplo completo)
    └── cadastro/           # Skeleton para a próxima feature de negócio
```

### Backend — Arquitetura Hexagonal (Ports & Adapters)

Cada módulo de backend segue as mesmas quatro camadas:

```
modules/<modulo>/
├── domain/            # entities, repositories (interfaces) e services (interfaces)
├── application/         # use-cases + dto — dependem apenas de abstrações do domain
├── infrastructure/       # implementações concretas (Prisma, bcrypt, etc.)
└── presentation/         # controllers (composition root) e routes (HTTP)
```

Regras aplicadas:

- **Domínio não conhece Prisma nem o framework.** As entidades (`User`, `AuthenticatedUser`)
  são classes puras em TypeScript; os repositórios são interfaces (`UserRepository`,
  `CredentialsRepository`).
- **Casos de uso dependem de abstrações.** `CreateUserUseCase`, `AuthenticateUserUseCase`
  etc. recebem as interfaces do domínio via construtor (injeção de dependência manual).
- **Infraestrutura implementa as interfaces do domínio.** `PrismaUserRepository` e
  `BcryptPasswordHasher` implementam os contratos definidos em `domain/`.
- **Presentation é o composition root do módulo.** O `controller` é o único lugar
  que instancia repositórios/adapters concretos e monta os casos de uso; as
  rotas HTTP (`app/api/**/route.ts`) apenas delegam para `presentation/routes`.

Fluxo de uma requisição (ex.: criar usuário):

```
route.ts → users.routes.ts → users.controller.ts → CreateUserUseCase → UserRepository (Prisma)
```

### Frontend — MVVM + Adapter Pattern

Cada módulo de frontend segue:

```
modules/<modulo>/
├── views/            # Componentes que apenas renderizam
├── view-models/       # Hooks com as regras de apresentação (orquestram Adapter + Service)
├── adapters/           # Traduzem dados entre a forma da API e a forma da UI
├── services/           # Única camada autorizada a chamar APIs externas (fetch, NextAuth)
├── stores/             # Estado global via Zustand
├── types/               # Tipos compartilhados do módulo
└── components/          # Componentes de apresentação reutilizáveis
```

Regras aplicadas:

- **Views apenas renderizam.** `LoginView` e `UsersView` não fazem fetch nem
  contêm regra de negócio: chamam um `view-model` (hook) e repassam os dados
  para componentes de apresentação.
- **ViewModels contêm as regras de apresentação.** Decidem quando chamar o
  service, como tratar erro/loading e para onde navegar (ex.:
  `useLoginViewModel` redireciona para `/dashboard` após sucesso).
- **Adapters transformam dados.** Ex.: `usersAdapter` converte a resposta bruta
  da API (`RawUserResponse`) para o formato consumido pela UI (`UserView`);
  `loginAdapter` traduz o resultado do NextAuth para um formato de UI.
- **Services fazem as chamadas HTTP/SDK.** `usersService` usa `fetch` contra
  `/api/users`; `authService` é o único lugar que importa `next-auth/react`.
- **Zustand gerencia o estado global** de cada módulo (`useAuthStore`,
  `useUsersStore`), evitando prop drilling entre view-models e componentes.

Fluxo de dados no frontend, conforme especificado:

```
View → ViewModel → Adapter → Service → API Externa
```

## Autenticação (NextAuth)

- Provider: `CredentialsProvider` (e-mail + senha), validado contra o módulo
  `auth` (hexagonal) via `authenticateController`.
- Estratégia de sessão: JWT (`session.strategy = "jwt"`), com `id` do usuário
  propagado para o token e para a sessão (ver `src/modules/auth/types/next-auth.d.ts`).
- Proteção de rotas: `src/middleware.ts` usa `next-auth/middleware` para proteger
  `/dashboard/*`; o layout do dashboard (`src/app/dashboard/layout.tsx`) também
  valida a sessão no servidor via `getServerSession`.
- Login/Logout: implementados como fluxo MVVM completo em `modules/auth`
  (`LoginView` → `useLoginViewModel` → `loginAdapter` → `authService`).
- Novos providers (Google, GitHub, e-mail, etc.) podem ser adicionados em
  `src/modules/auth/presentation/routes/next-auth.options.ts`, sem alterar o
  restante do módulo.

## Banco de dados

- **PostgreSQL** rodando via `docker-compose.yml` (serviço `postgres`, porta `5432`).
- **Prisma** como ORM, com schema em `prisma/schema.prisma`.
- Modelo inicial `User` (`id`, `name`, `email`, `password`, `createdAt`, `updatedAt`).
- Seed inicial em `prisma/seed.ts`, executado com `bun run db:seed`.

## Princípios adotados

- **SOLID** — cada caso de uso tem uma única responsabilidade; dependências
  fluem sempre em direção às abstrações do domínio (Dependency Inversion).
- **DRY** — lógica de erro HTTP, resposta HTTP e client Prisma centralizadas em
  `modules/shared`.
- **Separation of Concerns** — domínio, aplicação, infraestrutura e apresentação
  isolados no backend; view, view-model, adapter e service isolados no frontend.
- **Clean Code / Clean Architecture** — nomes explícitos, funções pequenas,
  dependências apontando para dentro (infra → aplicação → domínio).

## Qualidade de código

- **ESLint** (`eslint-config-next` + `@typescript-eslint`) — `bun run lint`.
- **Prettier** (com `prettier-plugin-tailwindcss`) — `bun run format`.
- **Husky** — hooks de `pre-commit` (lint-staged) e `commit-msg` (commitlint).
- **lint-staged** — roda ESLint + Prettier apenas nos arquivos staged.
- **commitlint** — exige mensagens de commit no padrão
  [Conventional Commits](https://www.conventionalcommits.org/).
- **EditorConfig** — padroniza indentação/charset entre editores.

## Próximos passos sugeridos

- Implementar a feature real do módulo `cadastro` seguindo o mesmo padrão de `users`
  (ver `src/modules/cadastro/README.md`).
- Adicionar testes automatizados (unitários para use-cases/view-models, e2e para
  os fluxos de login e cadastro).
- Adicionar providers OAuth adicionais ao NextAuth conforme a necessidade do negócio.
