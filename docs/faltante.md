# `/dashboard-new` — o que ainda falta

10 das 13 seções do `DashboardVendasData` já vêm de dado real via SST
(`resumoPorPeriodo`, `miniKpis`, `rankingPorMes`, `fornecedoresPorMes`,
`nacionalInternacionalPorMes`, `conversao`, `vendasMensais`,
`vendasDiarias`, `recencia`/`recenciaDetalhe`,
`cruzamentoCanais`/`cruzamentoDetalhe` — código em
`src/modules/dashboard-vendas/services/dashboard-vendas.sst-service.ts`).
Só `intraday`, `projecao` e `acuracia` continuam em
`dashboard-vendas.mock-service.ts`.

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

---

## Como `conversao.ambos`, `recencia` e `cruzamentoCanais` foram resolvidos sem endpoint novo do SST

Os três dependiam de saber, por agência, se ela vendeu aéreo e/ou
terrestre — o SST tem um endpoint pronto pra isso do lado aéreo
(`/api/consolidado/air/resumo-agrupado`, já agrupado por empresa, uma
chamada só, sem paginação), mas **não** tem equivalente pro terrestre.
Resolvido calculando isso no próprio código: paginar
`/api/resumos/terrestre` (bruto, uma linha por venda) e reduzir a um
`Map<codigo_cliente, {última venda, valor, qtd}>` aqui — o mesmo que um
"resumo-agrupado" faria, só que do nosso lado.

**Duas decisões explícitas tomadas nesse processo, com impacto real nos números:**

1. **Janela do terrestre reduzida pra 90 dias (não 365).** Paginar 365
   dias de terrestre é ~122 páginas (60.904 registros, testado contra o
   SST real) — concorrência alta demais, risco real de sobrecarregar o
   servidor deles (já vimos um 500 transiente até com uma janela menor).
   Com 90 dias fica em torno de ~30 páginas, dentro do que já testamos
   funcionar com retry. **Efeito**: uma agência cuja única venda
   terrestre foi entre 91 e 365 dias atrás **não aparece** nos dados —
   ela é sub-contada nas faixas "90-179"/"180+ dias sem vender" e no
   cruzamento de canais (pode aparecer como "só aéreo" quando na
   verdade também vende terrestre, só que fora da nossa janela de
   visão).
2. **`base-empresa-cadastro` não é "o roster de agências"** — checado
   contra o SST real: de uma amostra de 2.000 registros, só **8** eram
   `descricao_tipo_empresa = "AGENCIA"`; a esmagadora maioria (1.941) era
   `CIA AEREA`. Esse endpoint é um cadastro geral de empresas (fornecedores
   inclusos), não uma lista de agências. O denominador real de "carteira"
   usado aqui é o mesmo já usado em `conversao`: soma de `agencias_ativas`
   de `/api/reports/saude-bases` (17.763 num teste real, mesma ordem de
   grandeza do valor de referência da spec, 16.598).

**Consequências práticas dessas decisões:**

- **`recencia`/`recenciaDetalhe`**: `compraram30d`/`semVendas30dMais`
  (faixa 31-89) são precisos pros dois canais (30/89 dias cabem dentro da
  janela de 90 dias do terrestre). As faixas "90-179"/"180+" e
  `compraramAno` são precisas pro **aéreo** (janela de 365 dias) mas
  sub-contam o **terrestre** além dos 90 dias. `semVendasAno` (churn —
  comprou ano anterior, não comprou este ano) é calculado **só com
  aéreo** — cobrir o ano anterior inteiro do terrestre dobraria o custo de
  paginação já alto; por isso `soAereo` carrega o total inteiro dessa
  métrica e `soTerrestre`/`ambos` ficam em 0 (não fabricado).
- **`cruzamentoCanais`/`cruzamentoDetalhe`**: mesma limitação de janela —
  "últimos 365 dias" no nome da seção só é literalmente verdade pro lado
  aéreo; o terrestre olha só os últimos 90. `cruzamentoDetalhe.nenhum`
  fica com contagem real (por subtração do total de carteira) mas **lista
  de detalhe vazia** — não temos identidade de agências com zero venda
  detectada nas janelas usadas (não existe uma fonte confiável de "todas
  as agências, mesmo as que nunca compraram", pelo motivo #2 acima).
- **Identidade (nome/filial/executivo) incompleta pra quem só vende
  terrestre**: a fonte de identidade usada (`/api/agencias/top`, com
  janela de 365 dias numa chamada só) só cobre quem vendeu aéreo. Agências
  cujo único canal é terrestre aparecem com `filial`/`executivo` = `"—"`.
  `cnpj` fica vazio em ambas as seções — nenhuma das fontes usadas aqui
  (`resumo-agrupado`, `resumos/terrestre`, `agencias/top`) traz CNPJ.
  `gestor` também fica `"—"` — essa hierarquia (Executivo→Gestor) só
  existe no banco deste projeto (`Promotor.gestorId → Gestor`), não foi
  cruzada com o SST nesta rodada.

**Descoberto no processo**: sob a concorrência da paginação, o SST
devolveu um 500 transiente (`"[sigot] rawQuery failed"`) numa das
tentativas — adicionado retry curto (até 2 tentativas, só em 5xx) em
`sstGet`.

**Testado contra o SST real** (14/08/2026): carga fria completa do
dashboard em ~35s; números plausíveis (17.763 agências na carteira, 6,4%
vendendo os dois canais, 20,9% só aéreo, 0,6% só terrestre, 72,1% nenhum
detectado nas janelas usadas).

---

## Pendências — o que precisa ser pedido, e pra quem

### Melhoria de performance/precisão pro SST (não bloqueia, mas ajudaria)

1. **Um "resumo-agrupado" pronto pro terrestre** (mesmo formato do aéreo:
   agrupado por empresa, com data da última venda) eliminaria a
   necessidade de paginar `/api/resumos/terrestre` no código deste
   projeto — permitiria usar uma janela de 365 dias completa (não 90) sem
   o risco de sobrecarregar o servidor deles, resolvendo as sub-contagens
   descritas acima em `recencia`/`cruzamentoCanais`.

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
6. **Aceitar a janela reduzida de 90 dias pro terrestre em `recencia`/
   `cruzamentoCanais` como definitivo, ou vale investir em paginar mais
   (ou pedir o endpoint do item 1 acima) pra ter 365 dias completos?**
