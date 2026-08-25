# Substituir dados mock de `/crm/novas-agencias` por dados reais

> Plano aprovado em 2026-08-25. Escrito em `docs/` para sobreviver independente da conversa que o originou (ver `[[feedback_durable_plans_in_repo]]` na memória do assistente).

## Contexto

A página "Análise de Novas Agências" (`/crm/novas-agencias`) foi construída 100% mock por pedido explícito de uma SPEC de front-end (2026-08-18/21): nenhum dado vem de banco ou API, tudo está hardcoded em `novas-agencias.mock-service.ts`. O usuário agora quer que esses dados passem a vir de fontes reais — Prisma local (identidade/aprovação das agências) e o SST (`sst.flysakura.com`, ERP/vendas real da empresa), no mesmo padrão já usado por `dashboard-vendas`, `agencias-crm` e `atribuicoes`: um serviço real ativado por `SST_API_KEY`, com fallback mock granular quando a chave não está configurada ou uma chamada falha.

Duas decisões de negócio foram tomadas com o usuário antes deste plano:

1. **Estado "logou" removido.** Não existe, em lugar nenhum do sistema (SST ou banco local), um log de login/acesso de agência — `Agencia.travelLinkCriado` é uma flag manual do analista, não serve de proxy. O funil/tabela passam a ter só 3 situações: `nunca` / `comprando` / `parou`.
2. **Fallback igual aos módulos irmãos.** Sem `SST_API_KEY`: identidade e data de entrada continuam reais (vêm do Prisma, nunca dependem do SST); só as métricas de venda (volume, situação, 1ª compra) caem para mock determinístico.

Duas simplificações adicionais, propostas por serem o padrão do resto do projeto (nunca inventar número pra preencher espaço visual quando a fonte real não existe — mesmo critério de `dadosFaltantes: false sempre` em `agencias-crm`):

- **Bloco `sincronizacao`** (última sincronização/próxima) — não existe cron por trás disso; nenhum módulo irmão tem esse conceito (todos computam ao vivo, cacheado 10min). Remove-se o bloco; o `<Eye/>` do header passa a mostrar a hora real do request.
- **`totalAgencias: 28`** — resto de paginação nunca implementada (só 12 linhas existiam). Passa a ser sempre `agencias.length`.

## Arquitetura (reaproveitar o padrão `agencias-crm`, não a camada domain/use-case de `atribuicoes`/`cadastro`)

Esta é uma tela "CRM analytics read-only", igual a `/crm/agencias` e `/crm/dashboard` — não precisa da arquitetura em camadas (domain/application/infrastructure) do módulo `cadastro`. Segue o padrão mais simples: **loader (orquestra) → sst-service (chamadas HTTP) → adapter (funde e calcula)**.

```
page.tsx
  └─ novasAgenciasController.obterNovasAgencias()
       └─ carregarNovasAgencias()                          [novo: novas-agencias.loader.ts]
            ├─ carregarAgenciasAprovadasLocais()            → Prisma (sempre real)
            ├─ obterMetricasReaisOuNull()                   → REAPROVEITA agenciaCarteiraSstService.obterMetricasCarteira() (agencias-crm)
            └─ obterPrimeirasComprasPorAgencia(...)          → [novo] novas-agencias.sst-service.ts
       └─ montarNovasAgenciasView(...)                       [novo: novas-agencias.adapter.ts]
            → funde local + métricas SST em AgenciaNovaLinha[], calcula funil/KPIs, aplica fallback mock por linha
```

**Reaproveitar sem duplicar:**

- `agenciaCarteiraSstService.obterMetricasCarteira()` (`src/modules/agencias-crm/services/agencia-carteira.sst-service.ts`) — já retorna `Map<codigoEmpresa, {vendasAno, vendasMes, dataUltimaCompra, diasSemComprar, bilhetes}>` cruzando aéreo+terrestre. Cobre volume e "última compra"/situação sem endpoint novo.
- `sstGet`, `comCache`, `comFallback`, `usaSstReal`, `mapComConcorrenciaLimitada`, `hojeIso` (`src/modules/agencias-crm/infrastructure/agencia-sst-client.util.ts`) — client HTTP/cache/paginação compartilhado, não recriar.
- `hashParaNumero` (`src/modules/shared/utils/hash-deterministico.util.ts`) e o padrão `gerarMetricasMock` de `agencia-carteira.adapter.ts` — para o fallback mock por linha (agência sem `SST_API_KEY` ou sem `codigoEmpresa` resolvido).

## Queries Prisma

**Fonte de "entrada" (data de aprovação) — não é `Agencia.createdAt`** (isso é início do cadastro, não aprovação). A fonte certa é `HistoricoEtapaCadastro`, que registra toda transição de status com timestamp:

```ts
const desde = new Date();
desde.setDate(desde.getDate() - 90);

const transicoes = await prisma.historicoEtapaCadastro.findMany({
  where: { statusNovo: "ativo", createdAt: { gte: desde } },
  orderBy: { createdAt: "desc" },
  select: { agenciaId: true, createdAt: true },
});
// distinct por agenciaId mantendo a mais recente (primeira ocorrência, já que orderBy desc)
const entradaPorAgenciaId = new Map<string, Date>();
for (const t of transicoes)
  if (!entradaPorAgenciaId.has(t.agenciaId)) entradaPorAgenciaId.set(t.agenciaId, t.createdAt);

const agencias = await prisma.agencia.findMany({
  where: { id: { in: [...entradaPorAgenciaId.keys()] }, status: "ativo" },
  select: {
    id: true,
    razaoSocial: true,
    cnpj: true,
    executivo: { select: { nome: true, gestor: { select: { nome: true } } } },
    consultasSst: {
      where: { sucesso: true, encontrado: true },
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { codigoEmpresa: true },
    },
  },
});

const totalAtivasNoSistema = await prisma.agencia.count({ where: { status: "ativo" } });
```

Notas:

- Filtrar `status: "ativo"` na `Agencia` (não só a transição no histórico) evita mostrar uma agência que foi ativada e depois recusada de novo.
- `consultasSst` resolve o `codigoEmpresa` (código SICA) direto na mesma query, sem N+1 — é a chave de junção com o SST (mesmo campo que `agenciaCarteiraSstService` usa como `String(codigoEmpresa)`).
- `totalAtivasNoSistema` (count separado) alimenta `funil.baseAprovadas` — é o total histórico de agências ativas, um número diferente de `agencias.length` (que é só as aprovadas nos últimos 90 dias). O card já deixa isso textualmente claro ("base de N agências aprovadas").
- Coluna `meta` da tabela (hoje `"CNPJ · ERP 40000 · Cidade/UF"`): não há ERP nem cidade/UF direto na `Agencia` local. Reduzir para só CNPJ real. Cidade/UF real existiria via `Agencia → CadastroComplementar → Endereco` (join extra) — deixar como refinamento futuro, não bloqueante.
- Não reaproveitar `cadastroAdminController.listarCadastros` aqui: ele resolve muito mais do que a tela precisa (documentos, contratos, KPIs de fila) e não tem filtro de janela por data de aprovação — uma query Prisma própria e enxuta é mais simples.

## Cruzamento com o SST

**Volume/última compra:** `agenciaCarteiraSstService.obterMetricasCarteira()` reaproveitado tal qual, indexado por `String(codigoEmpresa)` resolvido acima.

**Situação** (`nunca`/`comprando`/`parou`):

```ts
function derivarSituacao(metricas?: MetricasCarteiraSst): SituacaoAgenciaNova {
  if (!metricas || metricas.vendasAno === 0) return "nunca";
  return metricas.diasSemComprar <= 90 ? "comprando" : "parou";
}
```

**Primeira compra** — o SST não tem endpoint de "1ª venda" (só "última venda" agregada). Aproximação: para cada agência com `codigoEmpresa` resolvido, paginar `/api/resumos/aereo` e `/api/resumos/terrestre` filtrando por `codigoEmpresa` numa janela que começa exatamente na data de **entrada** (aprovação) até hoje — e pegar a venda mais antiga encontrada. Como a janela por agência é curta (≤90 dias) e o número de agências novas é pequeno (dezenas, não milhares como a carteira inteira), isso é seguro sem paginação em massa; usar `mapComConcorrenciaLimitada` (mesmo limite de 15 dos módulos irmãos) para paralelizar entre agências. Essa aproximação é exata (não uma amostra limitada), porque não existe venda anterior à janela de busca por definição (a janela começa na própria aprovação).

**Agência sem `ConsultaSst` de sucesso** (sem `codigoEmpresa`): cai no mock por hash só naquela linha — mesmo critério já usado em `agencia-carteira.adapter.ts` para agência sem `sicaCodigo`. Não bloqueia a página.

## Mudança no contrato de tipos (`novas-agencias.types.ts`)

- `SituacaoAgenciaNova`: remove `"logou"`.
- `NovasAgenciasData`: remove `sincronizacao` e `totalAgencias` (campo separado).

Arquivos que precisam acompanhar essa mudança de tipo:

- `components/status-badge.tsx` — remove a entrada `logou` do `CONFIG`.
- `views/novas-agencias-view.tsx` — filtro `"nunca"` deixa de incluir `"logou"`; remove o bloco de 3 spans de `sincronizacao`; `<Eye/>` passa a mostrar a hora real do request (Server Component, sem estado client novo); `totalAgencias` passa a ser `dados.agencias.length`.
- `components/lista-agencias-card.tsx` — só recebe o número derivado, sem mudança de lógica interna.

## Cálculo do funil/KPIs

Agregação em memória dentro do adapter, sem endpoint novo: contagens por `situacao`, percentuais sobre `agencias.length`, soma de `vendasAno` para `volumeGerado`, e média de dias entre entrada e primeira compra (só para quem já comprou) para `tempoMedioPrimeiraCompraDias`. `funil.baseAprovadas` usa o `count` total de agências ativas (ver seção Prisma acima), não `agencias.length`.

## Arquivos a criar

- `src/modules/novas-agencias/infrastructure/prisma-novas-agencias.repository.ts` — as queries acima (agências aprovadas em 90d + count total ativo).
- `src/modules/novas-agencias/services/novas-agencias.sst-service.ts` — `obterPrimeirasComprasPorAgencia()`, reaproveitando `sstGet`/`comCache`/`mapComConcorrenciaLimitada` de `agencia-sst-client.util.ts`.
- `src/modules/novas-agencias/services/novas-agencias.loader.ts` — orquestra Prisma + `agenciaCarteiraSstService` (reaproveitado) + o novo sst-service; decide mock vs real via `usaSstReal()`.
- `src/modules/novas-agencias/adapters/novas-agencias.adapter.ts` — funde tudo em `NovasAgenciasData`; contém `derivarSituacao`, o cálculo do funil/KPIs, e o fallback mock por linha (hash determinístico, portado do `mock-service` atual).

## Arquivos a alterar

- `types/novas-agencias.types.ts` — remover `"logou"`, `sincronizacao`, `totalAgencias`.
- `presentation/controllers/novas-agencias.controller.ts` — chamar o novo loader em vez do mock service.
- `components/status-badge.tsx`, `views/novas-agencias-view.tsx`, `components/lista-agencias-card.tsx` — ajustes descritos acima.

## Arquivo a remover

- `services/novas-agencias.mock-service.ts` — deletar **depois** de portar a lógica de mock determinístico (por hash) para dentro do novo `adapter.ts`, para não deixar dois caminhos de mock divergentes no módulo (mesmo critério dos módulos irmãos, que não têm um mock-service residual separado).

## Ordem de implementação sugerida

1. Ajustar `novas-agencias.types.ts` (quebra intencional de tipo).
2. Ajustar `status-badge.tsx`, `novas-agencias-view.tsx`, `lista-agencias-card.tsx` para compilar com o tipo novo.
3. Criar `prisma-novas-agencias.repository.ts`.
4. Criar `novas-agencias.sst-service.ts`.
5. Criar `novas-agencias.adapter.ts` (fallback mock por linha + cálculo do funil + `derivarSituacao`).
6. Criar `novas-agencias.loader.ts` (orquestração).
7. Atualizar `novas-agencias.controller.ts`.
8. Deletar `novas-agencias.mock-service.ts`.

## Riscos/limitações a documentar no código

- Agência aprovada sem `ConsultaSst` de sucesso → linha cai no mock por hash, mesmo com `SST_API_KEY` configurada (esperado, não é bug).
- `codigoEmpresa` desatualizado/renumerado no SST → agência aparece como "nunca" (dado real coincidindo com "sem venda detectada no período", não um erro).
- Falha em `obterMetricasCarteira()` derruba a seção inteira de métricas para mock; falha só em `obterPrimeirasComprasPorAgencia()` derruba só a coluna "1ª compra" para "—", preservando volume/situação já resolvidos (`comFallback` por seção, mesmo padrão dos irmãos).
- Cache 10min de `obterMetricasCarteira()` é compartilhado com `/crm/agencias` (mesmo processo) — ganho de performance, não bug, se as duas páginas forem carregadas em sequência.

## Verificação

1. `bun run typecheck` e `bun run lint` após cada etapa da seção "Ordem de implementação" — o tipo quebrado na etapa 1 deve forçar todos os consumidores a se ajustarem antes de compilar.
2. Sem `SST_API_KEY` no `.env` local: `bun run dev`, abrir `/crm/novas-agencias` logado como ADMIN/DIRETOR_ANALISTA — confirmar que a lista de agências vem do Prisma local (nomes/CNPJ reais de agências `ativo` aprovadas nos últimos 90 dias, ou lista vazia se não houver nenhuma no ambiente local) e que volume/situação caem no fallback mock sem quebrar a página.
3. Com `SST_API_KEY` configurada (se disponível): confirmar que ao menos uma agência com `ConsultaSst` de sucesso mostra situação/volume reais, e que o funil/KPIs batem com a soma manual das linhas exibidas.
4. `bun run test` (suíte existente) para garantir que nada em `agencias-crm` quebrou com o reaproveitamento do `agenciaCarteiraSstService`.
