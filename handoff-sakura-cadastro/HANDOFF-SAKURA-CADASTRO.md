# Handoff — Design System + Blueprint do módulo `cadastro`

> Cole este arquivo na raiz do projeto Next.js e peça ao Claude Code deste
> repositório para ler e implementar. Ele descreve (1) o design system do
> Sakura (cores, fontes, logo, radius) traduzido pra esta stack e (2) a
> estrutura de front-end (MVVM) para as 3 áreas — Admin, Link 1 e Link 2 —
> dentro do módulo `cadastro`, que hoje só tem `.gitkeep`.
>
> Origem: código real do projeto `SakuraOnboarding` (React/Vite/Tailwind,
> feito no Lovable). Todo valor abaixo foi lido direto do código-fonte, não
> inventado. Onde algo não pôde ser confirmado (ex.: campos exatos de cada
> etapa do wizard), está sinalizado como "ler no código original" em vez de
> ser chutado.

---

## 0. Contexto de negócio

Mesmo domínio do Sakura: uma agência de viagens se pré-cadastra (**Link 1**),
depois recebe um link para completar o cadastro em várias etapas
(**Link 2**), e a equipe interna analisa/aprova em 5 etapas
(**Admin**). Hoje, neste projeto, isso é só o módulo `cadastro` vazio
(`.gitkeep`), enquanto o módulo `users` já é a referência de arquitetura
funcionando ponta a ponta.

---

## 1. Design tokens (copiar para `globals.css` + `tailwind.config.ts`)

### 1.1 Cor de marca

Cor de marca exata: **`#F60F9E`** (magenta-pink "Sakura 500").

```ts
// tailwind.config.ts — theme.extend.colors
sakura: {
  50:  '#fff0f8',
  100: '#ffe0f1',
  200: '#ffb8de',
  300: '#ff85c5',
  400: '#fb4daa',
  500: '#f60f9e', // cor de marca
  600: '#d40686',
  700: '#a60668',
  800: '#7a0a4f',
  900: '#530a37',
  950: '#2e0420',
},
success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
```

### 1.2 Variáveis CSS — `globals.css`

**Light mode (`:root`):**

```css
--background: 210 40% 98%;
--foreground: 222 47% 11%;
--card: 0 0% 100%;
--card-foreground: 222 47% 11%;
--primary: 323 90% 51%;
--primary-foreground: 0 0% 100%;
--secondary: 323 90% 51%;
--secondary-foreground: 0 0% 100%;
--muted: 210 40% 96%;
--muted-foreground: 215 16% 47%;
--accent: 323 100% 96%;
--accent-foreground: 323 90% 42%;
--destructive: 323 90% 51%;
--destructive-foreground: 0 0% 100%;
--border: 323 30% 92%;
--input: 323 30% 92%;
--ring: 323 90% 51%;
--radius: 0.5rem;
--success: 160 84% 39%;
--success-foreground: 0 0% 100%;
--warning: 38 92% 50%;
--warning-foreground: 0 0% 100%;
```

**Dark mode (`.dark`) — "deep navy aviation":**

```css
--background: 215 50% 6%;
--foreground: 210 20% 96%;
--card: 215 40% 10%;
--card-foreground: 210 20% 96%;
--primary: 322 100% 58%;
--secondary: 220 90% 60%;
--muted: 215 25% 15%;
--muted-foreground: 210 15% 65%;
--accent: 322 60% 22%;
--accent-foreground: 322 90% 90%;
--destructive: 322 100% 58%;
--border: 215 25% 18%;
--input: 215 25% 18%;
--ring: 322 100% 58%;
--success: 158 64% 52%;
--warning: 43 96% 56%;
--info: 199 89% 60%;
--pink-glow: 322 90% 60%;
--violet-glow: 220 80% 55%;
```

**Gradiente de marca (texto/destaques):**

```css
background: linear-gradient(
  120deg,
  hsl(322 90% 56%) 0%,
  hsl(322 90% 68%) 40%,
  hsl(322 70% 55%) 100%
);
```

### 1.3 Tipografia

| Área                      | Fonte                                                                                 | Como aplicar no Next.js                                                                                                                                                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin / painel interno    | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | Não precisa de `next/font` — é system-font stack puro, só declarar no `tailwind.config.ts` (`fontFamily.sans`/`display`).                                                                                                                                                                                                                |
| Link 1 e Link 2 (público) | **Rubik**, pesos 300/400/500/600/700/800/900 (Google Fonts)                           | Usar `next/font/google` em vez do `<link>` cru que o Sakura usa (Vite não tem essa otimização; aqui tem): `import { Rubik } from 'next/font/google'; const rubik = Rubik({ weight: ['300','400','500','600','700','800','900'], subsets: ['latin'] });` — aplicar a className só no layout das rotas públicas de cadastro, não no admin. |

Tamanhos base (mesma escala do Sakura): h1 22px/700, h2 18px/600, h3
16px/600, h4 14px/600, body 14px/400, label 12px/500.

### 1.4 Radius, animação, ícones

- `--radius: 0.5rem` (8px). No `tailwind.config.ts`: `borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' }`.
- Plugin `tailwindcss-animate` + keyframes `accordion-down/up`, `fade-in` (0.6s), `float` (3s loop).
- Ícones: `lucide-react`.
- shadcn/ui: `style: "default"`, `baseColor: "slate"`, `cssVariables: true`.

### 1.5 Logo

Arquivos já extraídos em `./logos/` junto com este documento:

- `logo-sakura-oficial.png` — logo oficial (usar em header, sidebar, telas de cadastro)
- `favicon.png` / `favicon.ico`

Copiar essa pasta para `public/` do projeto. Não existe versão SVG nem
versão branca separada — o próprio Sakura usa o mesmo PNG para os dois
casos.

---

## 2. Arquitetura de pastas — módulo `cadastro` (seguindo o padrão do módulo `users`)

Front-end em MVVM, backend em Hexagonal, mesma separação de camadas já
confirmada em `users`: `views` só renderizam, `view-models` orquestram
estado, `adapters` normalizam resposta da API pro shape da view, `services`
é a única camada que faz `fetch`, `stores` (Zustand) guardam estado puro.

```
modules/cadastro/
  domain/
    entities/
      agencia.entity.ts
      cadastro-complementar.entity.ts
    repositories/
      agencia-repository.ts            // porta
      cadastro-complementar-repository.ts
    services/
      etapa-avaliador.ts                // porta (regra de transição de etapa)
  application/
    use-cases/
      pre-cadastrar-agencia.use-case.ts       // Link 1
      complementar-cadastro.use-case.ts       // Link 2 (por passo)
      listar-cadastros.use-case.ts            // Admin listagem
      obter-detalhe-agencia.use-case.ts        // Admin dossiê
      avancar-etapa.use-case.ts               // Admin aprovação
  infrastructure/
    repositories/
      prisma-agencia.repository.ts
      prisma-cadastro-complementar.repository.ts
  presentation/
    controllers/
      cadastro-publico.controller.ts
      cadastro-admin.controller.ts
    routes/
      cadastro-publico.routes.ts
      cadastro-admin.routes.ts
  views/
    link1/
      cadastro-agencia-view.tsx
    link2/
      cadastro-complementar-view.tsx
    admin/
      admin-cadastros-view.tsx          // listagem/funil
      admin-empresa-view.tsx            // dossiê com stepper de 5 etapas
  view-models/
    use-cadastro-agencia.view-model.ts
    use-cadastro-complementar-wizard.view-model.ts
    use-admin-cadastros-list.view-model.ts
    use-admin-empresa-detail.view-model.ts
  adapters/
    agencia.adapter.ts
    cadastro-complementar.adapter.ts
  services/
    agencia.service.ts                 // fetch('/api/cadastro/agencia', ...)
    cadastro-complementar.service.ts
  stores/
    cadastro-wizard.store.ts           // Zustand: step atual, dados por step, progresso %
```

### 2.1 Rotas (App Router)

```
app/(public)/cadastro/[slug]/page.tsx              → Link 1 (CadastroAgenciaView)
app/(public)/cadastro-complementar/[token]/page.tsx → Link 2 (CadastroComplementarView)
app/(admin)/cadastros/page.tsx                      → Admin listagem (AdminCadastrosView)
app/(admin)/cadastros/[id]/page.tsx                 → Admin dossiê (AdminEmpresaView)
app/api/cadastro/agencia/route.ts
app/api/cadastro/complementar/[token]/route.ts
app/api/cadastro/admin/route.ts
app/api/cadastro/admin/[id]/route.ts
```

As rotas `(public)` **não** passam pelo guard de `middleware.ts` (que hoje só
protege `/dashboard/:path*` — vai precisar excluir explicitamente
`/cadastro` e `/cadastro-complementar` do matcher, e incluir
`/cadastros/:path*` como protegida).

### 2.2 Schema (Prisma) — só o essencial pra front funcionar

Hoje só existe o model `User`. Pro front ter o que consumir, o módulo
`cadastro` precisa de pelo menos:

```prisma
model Agencia {
  id            String   @id @default(cuid())
  razaoSocial   String
  cnpj          String   @unique
  etapaAtual    Int      @default(1) // 1..5, funil admin
  status        String   @default("em_analise") // em_analise | aprovado | rejeitado | desistente
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  complementar  CadastroComplementar?
}

model CadastroComplementar {
  id            String   @id @default(cuid())
  agenciaId     String   @unique
  agencia       Agencia  @relation(fields: [agenciaId], references: [id])
  passoAtual    Int      @default(1) // 1..7
  dadosPorPasso Json     // shape por passo — ver seção 3.2
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

Isso é o mínimo pra desbloquear o front-end. O shape real de
`dadosPorPasso` (um JSON por passo do wizard) e os campos do cadastro
inicial da agência estão totalmente detalhados, campo a campo, em
`CAMPOS-LINK1-LINK2.md` — use aquele documento como o contrato exato
entre front-end e back-end, já que você não é responsável pelo backend
neste projeto.

---

## 3. Blueprint página a página

### 3.1 Admin (`AdminCadastrosView` + `AdminEmpresaView`)

**Layout geral** — reaproveitar o padrão do `users` module pro shell, mas
com sidebar em vez de topbar simples:

- Sidebar com shadcn `Sidebar` (`collapsible="icon"`), grupos colapsáveis
  (ex.: "Onboarding", "Ferramentas", "Configurações"), badges numéricos ao
  lado de cada item de menu (contadores de pendências).
- Cabeçalho de página: breadcrumb `"Sakura · {Página}"` + nome/cargo do
  usuário logado (via `next-auth` session) + linha divisória
  `border-b border-sakura-100`.

**`AdminCadastrosView` (listagem):**

- Tabs "Em Análise" / "Desistentes".
- Fileira de cards de KPI clicáveis (`rounded-xl border bg-card px-4 py-3
shadow-sm`, número em `text-3xl font-bold`) — contadores por status
  (Notificações, Reprovadas, Aprovadas, Aguard. Aprovação Final).
- Funil de Etapas 1-5 como grid de cards clicáveis
  (`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2`), cada um com
  contagem — esse é o componente que mais se aproxima de um padrão tipo
  "pending actions" com fundo tintado por status (usar `--success`/
  `--warning`/`--destructive` como fundo tintado, não neutro).

**`AdminEmpresaView` (dossiê de uma agência):**

- Stepper de 5 etapas em formato tab-bar: `grid grid-cols-5 gap-0 rounded-lg
border bg-card`, cada etapa é um botão, etapa ativa em
  `bg-primary text-primary-foreground`, etapas concluídas mostram `✓`.
- Conteúdo por etapa como componentes separados (`Etapa2Parecer`,
  `Etapa3Contrato`, `Etapa4UsuarioMaster`, `Etapa5Aprovado` — nomes de
  referência do Sakura, adaptar aos use-cases reais).

_Não crítico pro MVP_ (existiam só no print de referência, sem
equivalente hoje nem no Sakura nem aqui — avaliar se vale a pena):
gráfico de receita/atividade, feed de atividade em tempo real, grid de
"quick actions" coloridos, ranking tipo "top sellers". Se decidir incluir,
`recharts` + o wrapper `chart.tsx` do shadcn resolvem o gráfico, e o
`avatar.tsx` do shadcn resolve o feed de atividade — nenhum dos dois exige
lib nova.

**KPIs, funil de etapas, colunas da listagem, filtros e o conteúdo +
botões + regra de transição de cada uma das 5 etapas do dossiê**: ver
`CAMPOS-ADMIN.md` — cobre a listagem (`AdminCadastros`) e o dossiê
(`AdminEmpresa`) etapa por etapa, incluindo as 3 regras de transição
explícitas (Etapa 2→3, 3→4, 4→5) e o padrão de "Forçar avanço" reusado
entre elas.

### 3.2 Link 1 (`CadastroAgenciaView`)

- Layout split-panel: card `max-w-6xl rounded-2xl sm:rounded-[2rem]
shadow-2xl shadow-sakura-900/5 flex border border-slate-100` — painel de
  marca à esquerda em gradiente `sakura-500→sakura-700`, formulário à
  direita.
- Formulário single-step (sem stepper, sem seleção de "tipo de cadastro").
- Footer estático (não sticky) com copyright + links de Termos/Privacidade;
  CTA de envio é o botão de submit dentro do próprio formulário.
- **Campos exatos, validações, máscaras e o que o submit faz**: ver
  `CAMPOS-LINK1-LINK2.md` (seção "LINK 1") — extraído linha a linha do
  `CadastroForm.tsx` e `useCadastroAgencia.ts` originais. Inclui a lista
  dinâmica de sócios, a integração com QSA da Receita, e o contrato de
  payload que a API nova precisa aceitar.

### 3.3 Link 2 (`CadastroComplementarView`)

- **Wizard de 7 passos confirmado**: `Documentos`, `Empresa`, `Comercial`,
  `Representação`, `Sócios`, `Endereço & Banco`, `Revisão`.
- Stepper visual: cabeçalho "Passo X de 7 — {label}" + "% concluído" +
  barra de progresso (`h-2 rounded-full bg-muted`) + trilha de 7 bolinhas
  numeradas clicáveis com `✓` nas concluídas (ocultar em mobile, `sm:flex`).
- Cada passo dentro de um `<Card>` shadcn (`CardHeader`/`CardTitle`) — dar
  uma sombra leve (o Sakura original usa `shadow-none`, mas pro visual dos
  prints de referência vale adicionar profundidade).
- Navegação "← Voltar / Avançar →" inline no fim do form; botão final
  "Enviar Cadastro Complementar" full-width.
- Banner de topo sólido com título "Cadastro Complementar" + razão social.
- **Campos exatos de cada um dos 7 passos, uploads, validações
  condicionais e o que o envio final faz**: ver `CAMPOS-LINK1-LINK2.md`
  (seção "LINK 2") — cobre passo a passo (Documentos, Empresa, Comercial,
  Representação, Sócios, Endereço & Banco, Revisão), incluindo os campos
  que só aparecem condicionalmente (representante terceiro, sócio casado,
  tipo de agência) e a lógica de navegação/rascunho entre passos.

---

## 4. Ordem de implementação sugerida

1. **Tokens visuais**: `tailwind.config.ts` + `globals.css` + fonte Rubik via
   `next/font` + logo em `public/`.
2. **Link 1**: mais simples (single-step), bom pra validar o layout
   split-panel e o fluxo `service → adapter → view-model → view` de ponta a
   ponta com um form pequeno.
3. **Link 2**: reaproveita o padrão de stepper — mais complexo por ter 7
   passos e estado de wizard (Zustand store dedicado).
4. **Admin**: shell (sidebar + header) primeiro, depois listagem, depois
   dossiê com o stepper de 5 etapas.
5. **Backend mínimo**: schema Prisma + use-cases + rotas API, só o
   suficiente pra desbloquear cada view acima — não é o foco deste
   handoff (que é front-end), mas sem isso as views não têm o que
   consumir.

---

## 5. O que NÃO foi assumido

Este documento (+ `CAMPOS-LINK1-LINK2.md`) cobre estrutura visual, de
pastas e campos de formulário com base em código real lido do Sakura,
linha a linha. Pontos específicos deixados deliberadamente em aberto (não
estimados) estão listados no fim de `CAMPOS-LINK1-LINK2.md` — ex.:
campos marcados como obrigatórios na tela do Passo 4 do Link 2 (Represen-
tação) sem bloqueio correspondente no código original.

As regras de negócio de transição entre as 5 etapas do Admin (o que
libera/bloqueia cada etapa, o que cada botão de aprovar/reprovar/forçar
avanço faz) estão totalmente cobertas em `CAMPOS-ADMIN.md`, incluindo os
3 pontos deixados em aberto no próprio código original (não neste
levantamento) — tab "Desistentes" sem UI, filtros sem controle visível, e
seleção em massa incompleta.
