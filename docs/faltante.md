# `/dashboard-new` — o que ainda falta

8 seções do `DashboardVendasData` já vêm de dado real via SST
(`resumoPorPeriodo`, `miniKpis`, `rankingPorMes`, `fornecedoresPorMes`,
`nacionalInternacionalPorMes`, `conversao`, `vendasMensais`,
`vendasDiarias` — código em
`src/modules/dashboard-vendas/services/dashboard-vendas.sst-service.ts`).
Este documento cobre só o que **ainda não está implementado**: as 5 seções
que continuam em `dashboard-vendas.mock-service.ts`, uma lacuna parcial
dentro de `conversao`, e a lista de pendências pra destravar o resto.

---

## Seções ainda mockadas

### 1. `intraday` — Vendas do dia em tempo real

**O que é:** gráfico com o volume de vendas de hoje, em buckets de 15
minutos, separado em nacional / internacional / terrestre — a visão "o que
está acontecendo agora".

**Dado que falta:** agrupar em buckets de 15min. A fonte é
`GET /api/resumos/aereo?createdAtStart=&createdAtEnd=` (campo `created_at`
por registro) — **não** `/api/bilhete/aereo`, que só tem granularidade de
dia. O endpoint é paginado e não agrega em buckets pronto; num dia cheio
pode ser bastante registro por carregamento de página. Falta implementar a
agregação e decidir uma estratégia de cache/volume antes.

### 2. `projecao` — Projeção de fechamento do dia

**O que é:** estimativa de quanto vai fechar o dia em vendas, a partir do
ritmo já realizado, com faixa de confiança e quebra Nacional/Internacional.

**Dado que falta:** decisão de negócio, não dado técnico — quantas semanas
de histórico usar, método de extrapolação, e como calcular a faixa
min/max. Sem isso definido, qualquer implementação seria um número
inventado (ver `docs/crm-backend.md`, decisões #3 e #4).

### 3. `acuracia` — Acurácia da projeção

**O que é:** compara, dia a dia, o que foi projetado (item 2) contra o que
realmente fechou.

**Dado que falta:** depende do item 2 (algoritmo de projeção) + uma tabela
que salve o snapshot da projeção todo dia + um job agendado que registre o
realizado no fim do dia. O SST já tem infra de cron própria (BullMQ) e
ofereceu hospedar esse job lá — falta decidir onde hospedar (SST ou este
projeto).

### 4. `recencia` / `recenciaDetalhe` — Inatividade da carteira

**O que é:** classifica agências por última compra — quem comprou nos
últimos 30 dias, quem comprou este ano, quem está sumido há 31-89 / 90-179
/ 180+ dias. Insumo de campanhas de reativação.

**Dado que falta:** data da última venda por agência, por canal (aéreo e
terrestre separados). O lado aéreo já existe
(`/api/consolidado/air/resumo-agrupado?agruparPor=codigoEmpresa`); o lado
terrestre **não existe ainda no SST**, mas é só backlog de engenharia — as
peças pra construir já existem no código deles (mesmo padrão de
`buildConsolidadoAirResumoAgrupadoSql`, replicável pro par SICA+SIGOT
terrestre via `selectTerrestreStrategy`/`mergeClientePorClienteRows`, já
usados em outros endpoints). Não é mais uma dúvida — é pedido de construir
um endpoint novo.

### 5. `cruzamentoCanais` / `cruzamentoDetalhe` — Cruzamento de canais

**O que é:** classifica a carteira em 4 grupos — só aéreo, só terrestre,
ambos, nenhum — pra identificar oportunidades de cross-sell.

**Dado que falta:** mesma dependência do item 4 (endpoint terrestre "por
agência" ainda não construído no SST) + cruzar essa informação com o
aéreo por agência no código deste projeto. Total de carteira (denominador)
já está resolvido: campo `total` de
`/api/reports/base-empresa-cadastro?empresaAtiva=SIM`.

---

## Lacuna parcial dentro de `conversao`

`conversao.aereo`/`.terrestre` estão implementados com dado real.
`conversao.ambos.saudePct` e `.agenciasMesVarPct` continuam do mock: somar
o nº de agências de aéreo + terrestre contaria duas vezes quem vende nos
dois canais — resolver isso direito depende do mesmo endpoint terrestre
"por agência" do item 4 acima.

---

## Pendências — o que precisa ser pedido, e pra quem

### Backlog de engenharia (pedir pro SST construir — não é mais dúvida)

1. **Equivalente terrestre do `/api/consolidado/air/resumo-agrupado`**
   (data da última venda por empresa, non-air). Desbloqueia `recencia`,
   `cruzamentoCanais` e o resto de `conversao`.

### Pergunta técnica pro SST (só eles sabem responder)

1. _(só relevante se a decisão de negócio abaixo for "somar os painéis")_
   Existe alguma forma de pedir um total Filial+Representante já somado,
   em vez de somar `filial.*` + `representante.*` no client? Confirmado
   que hoje genuinamente não existe.

### Decisões de negócio internas (dono do produto/time de vendas — não é pergunta técnica pro SST)

1. **Painel do `/overview`**: manter só `FILIAL` (implementado hoje) ou
   somar com `REPRESENTANTE`? Afeta `resumoPorPeriodo`, `miniKpis`,
   `conversao`, `vendasMensais`/`vendasDiarias`.
2. **`situacao=ATIVOS`** é a régua certa, ou o time espera ver `TODOS`
   (incluindo cancelados) em algum contexto?
3. **Janela "mês"/"ano"**: manter mês/ano-a-data (dia 1 até hoje,
   implementado hoje) ou comparar contra o mês/ano **fechado** anterior?
4. **Algoritmo de projeção** (`projecao`/`acuracia`): semanas de
   histórico, método de extrapolação, cálculo da faixa min/max.
5. **Onde hospedar o job diário de snapshot** da acurácia — SST ou este
   projeto.
