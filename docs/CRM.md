# CRM Sakura — Documentação Técnica da Página **Dashboard**

Rota: `/admin/n` (aliases antigos: `/admin/aprovadas/dashboard`)
Acesso: somente `admin` ou `diretor` (`AdminAprovadasDashboard.tsx` redireciona os demais para `/admin/aprovadas/agencias`).

Composição de arquivos:

```text
src/pages/AdminAprovadasDashboard.tsx      (guard de role)
└── src/components/aprovadas/AprovadosDashboard.tsx   (esqueleto / seções 1..6)
    ├── src/components/shared/BIReguaPanel.tsx        (Seção 1 — Régua BI)
    ├── src/components/aprovadas/dashboard/ProjecaoDiaCard.tsx      (Seção 2)
    ├── src/components/dashboard/InsightsCard.tsx                   (Seção 3)
    ├── src/components/aprovadas/dashboard/AcuraciaProjecaoCard.tsx (Seção 4 — admin)
    ├── (Seção 5 — cards de inatividade, inline)
    ├── src/components/dashboard/DashboardVendasNovo.tsx            (Seção 6)
    │   ├── MonthlySalesChart.tsx  (vendas mensais por modalidade)
    │   └── hooks Firestore (KPIs, diárias, top agências/fornecedores, nac/int)
    └── SectionCrossCanais.tsx     (Seção 7 — cruzamento de canais)
```

## Fontes de dados (backends)

| Fonte                                        | Base                                                  | Uso                                                                                                                                        |
| -------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **sakura-api** (GCP Cloud Run)               | `https://sakura-api-685293900038.us-central1.run.app` | snapshots Firestore agregados (SWR: Redis → Firestore → recompute). HTTP `202` = cache frio → retry com backoff (`src/lib/sakuraFetch.ts`) |
| **Edge Function `sst-consolidado-overview`** | Lovable Cloud → SST `/api/consolidado/overview`       | **fonte canônica oficial de vendas** (mesma do BI e da TV)                                                                                 |
| **Edge Function `projecao-dia`**             | Lovable Cloud                                         | pacing intradiário                                                                                                                         |
| **Postgres (RPC/MV)**                        | Lovable Cloud                                         | carteira de agências, buckets de inatividade, curvas históricas, acurácia                                                                  |

Regra de ouro do projeto: **todo valor de venda vem do consolidado SST** (`painel=FILIAL&situacao=ATIVOS`). Nunca somar `Filial` + `Representante`, e nunca somar tabelas locais para exibir faturamento.

---

## Seção 1 — Régua BI / “Vendas Filial”

**Componente:** `BIReguaPanel` (`defaultPeriod="hoje"`, `useSstOverview`)
**Objetivo:** número oficial de vendas com régua de períodos (`Hoje`, `Ontem`, `Este mês`, `Este ano`) + seletor de mês histórico.

**Lógica**

1. A janela é calculada em fuso de Brasília (`src/lib/brasiliaTime.ts`):
   - `hoje` → `inicio = fim = D`
   - `ontem` → `D-1` completo (00:00–23:59)
   - `mes` → dia 1 do mês → `D`
   - `ano` → 1º de janeiro → `D`
   - mês histórico → `YYYY-MM-01` até o último dia do mês
2. Caminho preferencial (`useSstOverview=true`): consolidado SST.
3. Fallbacks em cascata: snapshot `/dashboard/resumo` → `/dashboard/vendas-canonical` → `/dashboard/kpis-consolidado` (com `AbortController`, 8 s sem snapshot / 15 s com snapshot).
4. Refresh automático a cada 5 min e ao focar a janela.

**Endpoints**

```http
POST  functions/v1/sst-consolidado-overview?painel=FILIAL&situacao=ATIVOS   (invoke GET)
GET   {SAKURA}/dashboard/resumo[?ano=&mes=&painel=&produto=&reemissao=&reembolso=]
GET   {SAKURA}/dashboard/vendas-canonical?modalidade=todos&...filtros
GET   {SAKURA}/dashboard/kpis-consolidado?inicio=YYYY-MM-DD&fim=YYYY-MM-DD&...filtros
```

**Resposta — `sst-consolidado-overview`** (`data.filial`, buckets `dia|mes|ano`):

```json
{
  "filial": {
    "total":     { "dia": { "tarifa": 174233.5, "tickets": 212, "clientes": 96, "margem": 8.4 },
                   "mes": { "tarifa": 28629092.72, "tickets": 31877, "clientes": 1422, "margem": 7.9 },
                   "ano": { "tarifa": 1099384221.11, "tickets": 1204553, "clientes": 3187, "margem": 8.1 } },
    "aereo":     { "dia": {...}, "mes": {...}, "ano": {...} },
    "terrestre": { "dia": {...}, "mes": {...}, "ano": {...} }
  },
  "representante": { "...": "NUNCA somado ao painel Filial" },
  "generated_at": "2026-08-13T18:40:12.000Z"
}
```

**Resposta — `/dashboard/kpis-consolidado`** (normalizada em `normalizeConsolidado`):

```json
{
  "volume": 28629092.72,
  "volume_aereo": 24110000.0,
  "volume_terrestre": 4519092.72,
  "bilhetes": 31877,
  "bilhetes_aereo": 30122,
  "bilhetes_terrestre": 1755,
  "clientes": 1422,
  "ticket_medio_aereo": 800.4,
  "reemissoes": { "qtd": 812, "valor": 690233.1 },
  "cancelamentos": { "qtd": 1240, "valor": 1180422.5 },
  "rentabilidade": 2265000.0,
  "margem_pct": 7.9,
  "periodo": { "inicio": "2026-08-01", "fim": "2026-08-13", "cutoff": null }
}
```

Fórmulas exibidas: `ticket médio aéreo = volume_aereo / bilhetes_aereo`; `margem % = rentabilidade / volume`; `líquido = bruto − cancelamentos` (`src/lib/calcLiquidoTotal.ts`, sem subtrair reemissão — o faturamento SST já é desduplicado pelo bilhete novo).

---

## Seção 2 — Projeção do Dia

**Componente:** `ProjecaoDiaCard` + `src/hooks/useProjecaoDia.ts`
**Objetivo:** projetar o fechamento do dia a partir do realizado até a hora atual, com quebra por segmento (Internacional em rosa, Nacional em azul).

**Lógica**

1. `projecao-dia` (Edge Function) devolve o realizado do dia e a curva esperada acumulada por hora.
2. Curva histórica de referência: `fn_curva_intradia(p_dow)` — média por hora do mesmo dia da semana; `fn_curva_hoje` traz o acumulado real de hoje.
3. `projeção = realizado_até_H / share_esperado_até_H`, com peso ajustável de ±30 % via popover (weighting sobre a curva).
4. Segmentos Nacional/Internacional via `fn_projecao_dia_segmentos`.

**Endpoints**

```http
POST functions/v1/projecao-dia
RPC  fn_curva_intradia(p_dow int)
RPC  fn_curva_hoje(p_dia date)
RPC  fn_projecao_dia_segmentos()
```

**Resposta típica (`projecao-dia`)**

```json
{
  "dia": "2026-08-13",
  "hora_corte": 15,
  "realizado": 174233.5,
  "share_esperado": 0.42,
  "projecao": 414841.6,
  "faixa": { "min": 372000.0, "max": 458000.0 },
  "segmentos": { "nacional": 268000.0, "internacional": 146800.0 },
  "curva": [
    { "hora": 0, "acum_pct": 0.01 },
    { "hora": 9, "acum_pct": 0.18 }
  ]
}
```

---

## Seção 3 — Insights da Carteira

**Componente:** `InsightsCard` + `insightGenerators.generateVendasInsights`
**Lógica:** heurísticas puramente client-side sobre estatísticas anuais (melhor dia da semana, melhor semana do mês, sazonalidade, tendência). Nenhum cálculo no servidor além da agregação.

**Endpoint:** `RPC relatorio_vendas_ano_stats` (com timeout de 2,5 s e fallback `null` via `dashboardRpcFallback`); equivalente GCP: `GET {SAKURA}/dashboard/vendas-ano-stats`.

```json
{
  "por_dow": [{ "dow": 1, "volume": 41200000.0, "bilhetes": 44210 }],
  "por_semana_mes": [{ "semana": 1, "volume": 260000000.0 }],
  "por_mes": [{ "mes": "2026-01", "volume": 132000000.0 }],
  "ticket_medio": 812.44
}
```

---

## Seção 4 — Acurácia da Projeção (somente `admin`)

**Componente:** `AcuraciaProjecaoCard` (`useProjecaoAcuracia`)
**Lógica:** compara, para os últimos N dias, a projeção feita a cada hora com o fechamento real; calcula erro médio absoluto (MAPE) por hora e por dia — usado para auto-calibrar os pesos da Seção 2.

**Endpoints (paralelos)**

```http
RPC fn_projecao_acuracia_horaria(p_dias int)
RPC fn_projecao_acuracia_dias(p_dias int)
```

```json
[
  { "hora": 10, "erro_medio_pct": 12.4, "amostras": 30 },
  { "hora": 16, "erro_medio_pct": 4.1, "amostras": 30 }
]
```

---

## Seção 5 — Cards de Inatividade da Carteira (partição exclusiva)

**Onde:** inline em `AprovadosDashboard.tsx` (linhas ~452–832). Clique abre `AgenciasBucketDialog` (drill-down com a lista de agências).

**Regra central:** todos os buckets são calculados **sobre o ano-calendário corrente** (Brasília), formando uma partição exclusiva cuja soma é exatamente o total da base ativa.

| Card                | Definição                                                   |
| ------------------- | ----------------------------------------------------------- |
| Compraram (30d)     | última venda no ano há ≤ 30 dias                            |
| Compraram em {ano}  | tem ≥ 1 venda no ano corrente (derivado: base − sem vendas) |
| +30 dias sem vendas | soma de 31–89d, 90–179d e ≥180d sem vender (com subvalores) |
| Sem vendas em {ano} | comprou em {ano-1} e **não** comprou em {ano}               |

Cada card mostra o breakdown por canal: `só aéreo`, `só terrestre`, `ambos` (derivado de `ultima_aereo` / `ultima_terrestre`).
Overlay interno: `vendas_30d_sem_credito` = vendeu nos últimos 30d **e** `limite_aprovado`, `lim_credito`, `lim_cartao`, `limite_cartao_credito` todos ≤ 0.

**Fonte primária (client-side, precisa):** `fn_dashboard_agencias_aprovadas_json` (via `useFilteredAgencias`) — cálculo dos buckets no navegador com filtros de base/região/idade/canal.
**Fonte de contingência (snapshot):** `mv_agencias_kpis` — usada enquanto as datas de atividade não estiverem hidratadas, evitando “zerar” os cards.
**Comparativo ano a ano:** `fn_agencias_compraram_por_ano`.

```json
// mv_agencias_kpis (singleton = 1)
{ "total": 6221, "compraram_30d": 1422, "compraram_60d": 1988, "compraram_90d": 2410,
  "nunca_compraram": 1930, "refreshed_at": "2026-08-13T18:10:00Z" }

// fn_agencias_compraram_por_ano
{ "ano_atual": 2026, "compraram_ano_anterior": 4102, "compraram_ano_atual": 3877, "so_ano_anterior": 918 }

// fn_dashboard_agencias_aprovadas_json (linha)
{ "cadastro_id": "uuid", "cod_agencia": "61763", "nome": "CHINA BRASIL VIAGENS",
  "ultima_aereo": "2026-08-12", "ultima_terrestre": null,
  "limite_aprovado": 0, "lim_credito": 0, "lim_cartao": 0, "limite_cartao_credito": 0,
  "base_id": "uuid", "regiao_id": "uuid", "canal": "aereo" }
```

---

## Seção 6 — Bloco “Vendas” (`DashboardVendasNovo`)

Recebe os filtros BI compartilhados (`painel`, `produto`, `reemissao`, `reembolso`). No mount faz **prefetch paralelo** de 9 queries populando o React Query com as mesmas `queryKey` dos hooks filhos (elimina “Carregando…”). `staleTime` padrão de 5–10 min; `refetchInterval` acompanha `useSyncRefreshInterval`.

### 6.1 “Conversão” / Panorama

- **Saúde (%)** = `agências vendendo nos últimos 30 dias ÷ agências ativas` (campo `saude_pct`).
- **Variações %** (Volume, Bilhetes, Agências) = mês corrente `1 → D-1` **vs** mesmo intervalo do mês anterior.
- Fonte: `GET {SAKURA}/dashboard/vendas-kpis?modalidade=…&painel=…&produto=…&reemissao=…&reembolso=…`

```json
{
  "saude_pct": 41.7,
  "volume_mes": 28629092.72,
  "volume_var_pct": -3.2,
  "bilhetes_mes": 31877,
  "bilhetes_var_pct": 1.8,
  "agencias_vendendo_mes": 1422,
  "agencias_mes_anterior": 1466,
  "agencias_var_pct": -3.0
}
```

### 6.2 Mini-cards “Aéreo no Mês” / “Terrestre no Mês” (+ margem)

Fonte: `sst-consolidado-overview?painel=FILIAL&situacao=ATIVOS` (mesmo payload da Seção 1) — usado justamente porque o snapshot Firestore pode ficar defasado. Terrestre inclui `markup` no total.

### 6.3 Vendas mensais por modalidade (`MonthlySalesChart`)

Fonte: Edge Function de séries mensais (fallback `GET {SAKURA}/dashboard/...` mensal). Série de 12 meses, empilhada por modalidade.

```json
{ "items": [{ "mes": "2026-01", "volume_aereo": 96000000.0, "volume_terrestre": 15200000.0 }] }
```

### 6.4 Vendas Diárias (últimos 30 dias)

Fonte: `GET {SAKURA}/dashboard/vendas-diarias?dias=30&modalidade=…`
Fórmula canônica: **aéreo = `tarifa + tarifa_adicional`** em documentos `TICKET`/`ETKT`, não cancelados, reemissão incluída; **terrestre = `tarifa_cliente`**, não cancelado. Fuso de Brasília; datas `YYYY-MM-DD` parseadas manualmente para não recuar um dia. Linha de referência = média do período. Se uma modalidade soma zero, a série é ocultada e marcada “(sem dados)”.

```json
{
  "items": [
    {
      "data": "2026-08-12",
      "volume_aereo": 1120340.55,
      "volume_terrestre": 148002.1,
      "bilhetes_aereo": 1310,
      "bilhetes_terrestre": 74
    }
  ]
}
```

### 6.5 Top 10 Agências / Top 10 Fornecedores (toggle Mês/Ano)

```http
GET {SAKURA}/dashboard/top-agencias?modalidade=&periodo=mes|ano&limit=10
GET {SAKURA}/dashboard/top-fornecedores?modalidade=&periodo=mes|ano&limit=10
```

```json
[{ "cadastro_id": "uuid", "cod_agencia": "61763", "agencia_nome": "CHINA BRASIL VIAGENS",
   "volume": 1820000.0, "bilhetes": 1932, "modalidade": "misto" }]

[{ "fornecedor": "LATAM", "sigla": "JJ", "modalidade": "aereo",
   "volume": 9120000.0, "bilhetes": 10233, "share_pct": 31.9 }]
```

Regras de apresentação: `modalidade = misto` recebe a tag `A+T`; nome de fornecedor puramente numérico (bug de upstream) é traduzido pelo mapa IATA local `SIGLA_TO_NOME` (`src/lib/companhiasAereas.ts` para cores/nomes); logo via `pics.avs.io/200/200/{SIGLA}.png` com fallback de sigla colorida. Clique navega para `/admin/aprovadas/empresa/:cadastro_id` e `/admin/aprovadas/companhias`.

### 6.6 Nacional vs Internacional

Fonte: `GET {SAKURA}/dashboard/vendas-nac-int?periodo=mes|ano` — gráfico de 2 fatias (Nacional azul, Internacional rosa).

```json
{
  "nacional": { "volume": 18200000.0, "bilhetes": 24110 },
  "internacional": { "volume": 10429092.72, "bilhetes": 7767 }
}
```

### 6.7 Reemissões / Cancelamentos do ano

`GET {SAKURA}/dashboard/reemissoes-ano` e `GET {SAKURA}/dashboard/cancelamentos-ano` (usados no cálculo do líquido anual; os painéis detalhados vivem em `/admin/aprovadas/companhias`).

```json
{
  "total_qtd": 9812,
  "total_valor": 7412330.55,
  "por_mes": [{ "mes": "2026-01", "qtd": 812, "valor": 690233.1 }]
}
```

---

## Seção 7 — Cross-Canais

**Componente:** `SectionCrossCanais` — recebe por prop a lista de agências de `fn_dashboard_agencias_aprovadas_json` e cruza com `fn_agencia_vendas_canais_json`. Classifica a carteira em `só aéreo`, `só terrestre`, `ambos` e mostra oportunidades de cross-sell. Cálculo 100 % client-side (nenhuma chamada extra).

---

## Blocos auxiliares

- **Atalhos mobile:** Agências (`mv_dashboard_kpis.aprovadas`) e Voando hoje (`RPC fn_calendario_resumo_topo` → `{ "voando_hoje": 1842 }`). Deliberadamente sem outros números para não divergir do BI.
- **Vendas de hoje por modalidade:** `RPC fn_dashboard_vendas_hoje_breakdown` → `{ "total_volume": 174233.5, "aereo": { "volume": 148002.1, "bilhetes": 174, "agencias": 96 }, "terrestre": {...} }`.
- **Última sincronização:** `GET {SAKURA}/sst/last-run` → `{ "last": { "executed_at": "…" }, "cursor": { "last_sync_at": "…" } }`, exibida como linha pulsante discreta (`LastUpdatedBadge`).
- **KPIs de cadastro/pipeline:** `mv_dashboard_kpis` (singleton) com janelas pré-materializadas `vendendo_7d/30d/60d/90d/180d/365d`; a janela é escolhida pelo filtro de período da página.

## Padrões técnicos transversais

1. **Resiliência:** `dashboardRpcFallback` aborta RPCs em 2,5 s e devolve fallback — nenhum painel derruba a página. Erros do SST degradam silenciosamente (`console.warn`).
2. **Cache:** React Query com `staleTime` 5 min, `gcTime` 30 min, `refetchOnMount: false`, `placeholderData: keepPreviousData`; invalidação seletiva a cada `max(15 min, syncMs)`.
3. **HTTP 202 = cache frio** no sakura-api → retry com backoff (`sakuraRetryDelay`), nunca bloqueia a UI.
4. **Fuso:** todo corte de data usa `src/lib/brasiliaTime.ts` (UTC-3), nunca `new Date(string)` sobre datas puras.
5. **Formatação:** `src/lib/formatMoney.tsx` — `fmtBRLShort` (K/M/B) nos eixos, valor integral com centavos reduzidos nos cards principais, `tabular-nums` em todos os números.
