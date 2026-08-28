# Filtro "Personalizado" do `/crm/dashboard` — o que falta no SST

O filtro de período do cabeçalho (`filtro-periodo-dashboard.store.ts`)
já tem UI completa pra "Personalizado" (calendário de intervalo,
`dataInicial`/`dataFinal` salvos na store), mas nenhum consumidor usa
essas datas de verdade — `resolverPeriodo()` sempre cai pro fallback
`"mes"` (decisão do usuário, 2026-08-18/19), com aviso na tela avisando
que é só prévia. Este documento descreve o que precisa existir do lado
do SST pra isso virar dado real.

---

## O que já funciona hoje sem pedir nada novo ao SST

Nem tudo depende de endpoint novo — parte do que o card de Resumo/
Rankings precisa **já aceita `startDate`/`endDate` arbitrários**:

| Dado                                             | Endpoint                        | Aceita intervalo livre?                                                            |
| ------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------- |
| Top 10 Agências                                  | `GET /api/agencias/top`         | Sim — já usado assim pra "mês"/"ano" (mês-a-data, ano-a-data) em `obterResumoEDia` |
| Top 10 Fornecedores                              | `GET /api/reports/ranking-cias` | Sim, mesmo caso                                                                    |
| Totais aéreo (`tarifa`/`clientes`/`tickets`)     | `GET /api/consolidado/air`      | Sim (aceita `startDate`/`endDate`, sem `data`)                                     |
| Totais terrestre (`tarifa`/`clientes`/`tickets`) | `GET /api/consolidado/non-air`  | Sim, mesmo caso                                                                    |

Ou seja: **Rankings e Fornecedores dá pra plugar no "Personalizado" hoje,
sem mudança nenhuma no SST** — só passar `dataInicial`/`dataFinal` da
store nesses dois endpoints em vez de `inicioMes`/`inicioAno`.

O que trava é o card de **Resumo do dia** (margem, rentabilidade,
ticket médio, split nacional/internacional) — ver abaixo.

---

## O que falta: um "overview" que aceite intervalo arbitrário

### Baseado em qual endpoint

`GET /api/consolidado/overview` — usado hoje em `obterResumoEDia`
(`dashboard-vendas.sst-service.ts:1373`) com um único parâmetro `data`
(uma data de referência). A resposta já vem com 3 janelas fixas
embutidas (`dia`/`mes`/`ano`, todas relativas a essa `data`), por isso
serve pra "Hoje"/"Ontem"/"Mês"/"Ano" mas não pra um intervalo qualquer
escolhido no calendário.

**Proposta**: mesmo endpoint (ou um novo, ex.
`/api/consolidado/overview-intervalo`), mas recebendo `startDate`/
`endDate` em vez de `data`, e devolvendo os mesmos campos hoje presentes
em cada bucket de período — só que para o intervalo inteiro, sem os
buckets fixos dia/mes/ano.

Mantém os mesmos parâmetros de filtro que o `/overview` atual já aceita:
`painel=FILIAL` e `situacao=ATIVOS`.

### Quais dados esse endpoint precisa trazer, e o que cada um representa

Mesmo shape do `RawPeriodoOverview` atual, repetido por canal
(`total`, `aereo`, `terrestre`) — é o mesmo grupo de campos que já
alimenta `resumoPorPeriodo` e `miniKpis` hoje:

| Campo                                          | O que representa                                                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tarifa`                                       | Valor total vendido no intervalo (R$), base de tudo — é o "Volume" mostrado no card                                                                           |
| `margem`                                       | Margem percentual do período sobre `tarifa`                                                                                                                   |
| `rentabilidade`                                | Resultado em R$ da margem aplicada sobre a tarifa (`tarifa * margem`) — mostrado como "Rentabilidade" no card                                                 |
| `clientes`                                     | Quantidade de clientes/agências distintos que compraram no intervalo — vira o mini-KPI "Clientes distintos"                                                   |
| `tickets`                                      | Quantidade de bilhetes/vendas no intervalo — vira "Bilhetes" (aéreo) e conta pro "Ticket médio"                                                               |
| `ticket_medio`                                 | `tarifa / tickets` do intervalo — mini-KPI "Ticket médio"                                                                                                     |
| `nacInter.nacional` / `nacInter.internacional` | Split do canal aéreo entre rotas nacionais e internacionais, cada um com `tickets`, `tarifa` e `percentual` — alimenta a barra Nacional×Internacional do card |

Precisa vir separado por canal porque o card de Resumo mostra Aéreo e
Terrestre lado a lado, cada um com sua própria margem/rentabilidade —
não dá pra derivar isso de `/api/consolidado/air` +
`/api/consolidado/non-air` porque esses dois não trazem `margem`,
`rentabilidade`, `ticket_medio` nem `nacInter`, só `tarifa`/`clientes`/
`tickets`.

### Como isso seria consumido depois de existir

- **Uma chamada** com `startDate`/`endDate` = o intervalo escolhido no
  calendário → vira o dado "atual" do card.
- **Uma segunda chamada**, mesmo endpoint, com `startDate`/`endDate`
  deslocados 1 ano pra trás (mesmo intervalo, mesma duração) → vira o
  comparativo "LY" (mesmo padrão já usado hoje pra Hoje/Ontem, só que
  hoje é "mesmo dia, 1 ano atrás"; aqui seria "mesmo intervalo, 1 ano
  atrás").
- Nenhuma chamada extra de `nacInter` seria necessária (o campo já vem
  embutido, mesmo padrão do `/overview` atual).

---

## Contrato técnico proposto

### Request

```
GET /api/consolidado/overview-intervalo
```

| Parâmetro   | Tipo   | Obrigatório | Formato/valores | Observação                                                                                                                                                  |
| ----------- | ------ | ----------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `startDate` | string | sim         | `YYYY-MM-DD`    | Início do intervalo (inclusivo)                                                                                                                             |
| `endDate`   | string | sim         | `YYYY-MM-DD`    | Fim do intervalo (inclusivo)                                                                                                                                |
| `painel`    | string | sim         | `FILIAL`        | Mesmo valor sempre usado nos outros endpoints de consolidado hoje — não precisa aceitar `REPRESENTANTE`/`AMBOS` a menos que isso mude no resto do dashboard |
| `situacao`  | string | sim         | `ATIVOS`        | Mesmo caso do `painel` — mantém consistente com `/overview` atual                                                                                           |

Mesma autenticação dos demais endpoints do SST usados neste projeto:
header `X-Internal-Secret` (ver `flysakura-sst-http.util.ts`), mesma
base URL (`sstBaseUrl()`).

### Response — 200

Mesmo formato de `RawPeriodoOverview` hoje devolvido dentro de cada
bucket `dia`/`mes`/`ano` do `/overview` atual, só que **sem** esses
buckets — um único período (o intervalo pedido), por canal:

```json
{
  "filial": {
    "total": {
      "tarifa": 128430.5,
      "margem": 12.4,
      "rentabilidade": 15925.38,
      "clientes": 342,
      "tickets": 890,
      "ticket_medio": 144.3,
      "nacInter": {
        "nacional": { "tickets": 610, "tarifa": 79200.0, "percentual": 61.7 },
        "internacional": { "tickets": 280, "tarifa": 49230.5, "percentual": 38.3 }
      }
    },
    "aereo": { "...": "mesmo shape de total" },
    "terrestre": {
      "...": "mesmo shape de total, nacInter pode vir zerado (canal não tem rota nac/inter)"
    }
  }
}
```

Não precisa de envelope de paginação (`{data, total}`) — é um objeto
agregado único, igual ao `/overview` atual (não uma lista).

### Casos de erro / validação esperados

| Caso                                        | Comportamento esperado                                                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `startDate` ou `endDate` ausente            | `400`, mesmo padrão de validação já usado em `/overview`/`/consolidado/air` pra parâmetro obrigatório faltando                                        |
| `startDate > endDate`                       | `400` — intervalo invertido não deve silenciosamente devolver vazio                                                                                   |
| Formato de data inválido (não `YYYY-MM-DD`) | `400`, mesmo padrão dos outros endpoints de consolidado                                                                                               |
| Intervalo sem nenhuma venda no período      | `200`, com os campos numéricos zerados (`tarifa: 0`, `tickets: 0`, etc.) — **não** `404`, mesmo critério do `/overview` atual pra um dia sem venda    |
| Data futura em `endDate`                    | Sem necessidade de bloquear no servidor — o calendário do front já impede selecionar datas futuras; se o SST quiser validar também, `400` é aceitável |

### O que reaproveitar 1:1 do `/overview` atual (perguntar se já é automático)

- Mesmo hardcode de `FILIAL`-only / `ATIVOS`-only nos 3 endpoints de
  ranking, se fizer sentido criar variantes com intervalo pra eles
  também no futuro (fora do escopo deste pedido, hoje eles já aceitam
  `startDate`/`endDate`).
- Mesmo tratamento de timezone usado no `/overview` (data de referência
  em `America/Sao_Paulo`) — confirmar se `startDate`/`endDate` também
  são interpretados nesse fuso.

---

## Decisão de negócio em aberto (não é pergunta técnica pro SST)

Pra um intervalo arbitrário, "mesmo intervalo, 1 ano atrás" pode não
fazer sentido em todo caso (ex.: intervalo que cruza uma virada de mês
com número de dias diferente no ano anterior por causa de fim de
semana/feriado). Vale confirmar com o time de vendas se essa
comparação LY continua sendo a régua certa pra "Personalizado", ou se
o comparativo desaparece nesse modo.

---

## Resumo — o que pedir ao SST

1. **Novo parâmetro ou novo endpoint**: `/api/consolidado/overview`
   (ou variante) aceitando `startDate`/`endDate` além do `data` atual,
   devolvendo os mesmos campos de `RawPeriodoOverview`
   (`tarifa`/`margem`/`rentabilidade`/`clientes`/`tickets`/
   `ticket_medio`/`nacInter`) por canal (`total`/`aereo`/`terrestre`),
   para o intervalo inteiro (sem os buckets fixos dia/mes/ano).
2. Manter os mesmos parâmetros de filtro (`painel`, `situacao`) e o
   mesmo comportamento hardcoded (`FILIAL`-only, `ATIVOS`-only) dos
   outros endpoints de consolidado, pra não divergir do resto do
   dashboard.

Sem isso, dá pra ligar "Personalizado" parcialmente (Rankings e
Fornecedores, que já aceitam intervalo livre), mas o card de Resumo do
dia continuaria mostrando o fallback de "Mês" até esse endpoint existir.
