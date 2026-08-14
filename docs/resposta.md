# Resposta ao `faltante.md` — validações confirmadas no código do SST

Este documento responde ponto a ponto às dúvidas levantadas em
`docs/infos/faltante.md` (relatório do consumidor do `/dashboard-new`),
conferidas diretamente contra o código-fonte deste serviço (rotas, queries SQL
e infra). Onde havia uma "dúvida em aberto" no relatório, ela foi respondida
com a evidência do código. Onde o entendimento do consumidor estava
equivocado, a correção está marcada como **⚠️ Correção**.

---

## 1. Filial vs. Representante vs. Ambos

### `painel=AMBOS` não soma Filial + Representante ⚠️ Correção

O relatório supõe que `painel=AMBOS` daria um número maior/combinado, e que
`painel=FILIAL` (usado hoje) poderia estar **subestimando** os totais frente a
isso. Não é esse o comportamento:

> `consolidado.routes.ts:578` — _"FILIAL/REPRESENTANTE retornam só a chave
> correspondente (ex: `{filial: {...}}`, sem "representante"); AMBOS retorna
> `{filial, representante}` — as 2 visões lado a lado, **sem consolidar**"_

Ou seja: **não existe hoje um número único "Filial + Representante somados"**
vindo do `/overview`. `AMBOS` devolve os dois objetos separados
(`{filial: {...}, representante: {...}}`), nunca uma soma pronta.

**Como consumir:** se o dashboard quiser um total combinado, precisa somar
`filial.*` + `representante.*` no próprio front, chamando com
`painel=AMBOS`. Se `painel=FILIAL` (o que já está implementado) é a régua
correta pro dashboard de vendas é uma decisão de negócio — mas tecnicamente
não é "subestimado" comparado a nada, porque o SST não devolve um total
consolidado pronto.

### Os 3 endpoints de ranking/nac-int JÁ SÃO Filial-only — não é ambíguo

O relatório levanta como dúvida aberta (item 1 do resumo de validação) se
`agencias/top`, `reports/ranking-cias` e `consolidado/nacional-vs-internacional`
somam Filial+Representante ou são só um dos dois, já que nenhum aceita
parâmetro `painel`. **Dá pra responder com certeza lendo o SQL:**

| Endpoint                                         | Evidência                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `GET /api/agencias/top`                          | `topAgencias.ts:21` — `WHERE v.cancelado = 0 AND b.mpd = 0`         |
| `GET /api/reports/ranking-cias`                  | `rankingCias.ts:17` — `WHERE v.cancelado = 0, b.mpd = 0`            |
| `GET /api/consolidado/nacional-vs-internacional` | `nacionalVsInternacional.ts:6` — `WHERE v.cancelado = 0, b.mpd = 0` |

Os três hardcodeiam `b.mpd = 0` — e essa é literalmente a definição de
`FILIAL` usada em todo o resto da API (`consolidado.routes.ts:172`: _"FILIAL
= só TICKET (mpd=0)"_).

**Conclusão:** os 3 endpoints já são equivalentes a `painel=FILIAL`, sempre —
não há como pedir a visão Representante neles, e eles **não somam** os dois
painéis. Os números batem com `resumoPorPeriodo`/`miniKpis` (que também usam
`FILIAL`) — não há inconsistência entre eles nesse critério.

### `situacao`/`status` também é fixo (ATIVOS) nesses 3 endpoints

Diferente do `/overview` (que aceita `situacao=ATIVOS|CANCELADOS|TODOS`), os
três endpoints acima **não recebem esse parâmetro** — o SQL hardcodeia
`v.cancelado = 0` sem opção de mudar. Não é "o default é ATIVOS, mas dá pra
confirmar depois" — é fixo, não configurável. O ponto 3 do resumo de
validação do relatório está correto na prática (comportamento é ATIVOS), só
não é um "default" no sentido de aceitar outro valor — é hardcoded.

### `canal: "aereo"` no ranking de agências não é aproximação — é garantido

`GET /api/agencias/top` (`topAgencias.ts`) consulta exclusivamente
`pub_sica.bilhete` (tabela de bilhetes **aéreos** do SICA) — vendas
terrestres de uma agência **nunca** entram no `tarifa_total`/`total_bilhetes`
desse ranking. Pode remover o "aproximação" do comentário no código do
adapter e documentar como fato: este ranking é 100% aéreo, sempre.

---

## 2. Bug do código IATA numérico (`ranking-cias`) — já existe tentativa de tradução

`rankingCias.ts:33` já faz `LEFT JOIN pub_sica.ciaaerea cia ON
CAST(b.codfor AS VARCHAR) = cia.codcia` pra trazer `nomecia`. O fallback pro
código numérico (`rankingCias.ts:8`: `row.nomecia ?? row.codfor`) só acontece
quando esse JOIN não encontra correspondência — ou seja, **não é falta de
lógica de tradução, é gap de dado** na tabela `ciaaerea` (companhia sem
cadastro, ou tipo/formato de código desencontrado). Criar uma tabela de
tradução aqui não resolveria sozinho — o gap está na base de origem (SICA).

**Reaproveitar solução existente:** o CRM antigo já resolveu exatamente esse
mesmo problema **no client**, com um mapa local IATA→nome
(`SIGLA_TO_NOME`, em `src/lib/companhiasAereas.ts` — ver
`docs/infos/CRM.md:261`). Recomendação: portar esse mesmo mapa pro
`/dashboard-new` como fallback de exibição, em vez de tratar como bloqueio
que depende do SST.

---

## 3. `/api/bilhete/aereo` NÃO aceita timestamp — usar `/api/resumos/aereo` pro `intraday`

O relatório assume que os dois endpoints (`/api/resumos/aereo` e
`/api/bilhete/aereo`) aceitam `createdAtStart`/`createdAtEnd`. **Só o
primeiro aceita:**

- `GET /api/resumos/aereo` — aceita `createdAtStart`/`createdAtEnd`
  (formato `YYYY-MM-DDTHH:mm:ss`, validado em `resumos.routes.ts:33,138-139`),
  filtra por `b.createdat` (timestamp completo, `resumosAereo.ts:67-68`) e
  devolve o campo `created_at` por registro (`resumosAereo.ts:48`).
- `GET /api/bilhete/aereo` — só aceita `startDate`/`endDate` (granularidade de
  dia), **sem** parâmetro de timestamp.

**Para o `intraday`:** a fonte certa é `GET /api/resumos/aereo` com
`createdAtStart`/`createdAtEnd` cobrindo o dia inteiro. É paginado (não tem
agregação em buckets pronta — precisa buscar os registros e agrupar em
janelas de 15min no client), então confirma a preocupação do relatório sobre
volume/paginação: num dia cheio isso pode ser bastante registro pra puxar a
cada carregamento de página.

---

## 4. `/api/reports/base-empresa-cadastro` devolve lista paginada, não um número pronto

`GET /api/reports/base-empresa-cadastro?empresaAtiva=SIM` devolve uma lista
de empresas/agências (uma linha por empresa), com paginação padrão
(`{data, total, page, limit, offset}`). **Não** devolve diretamente "o total
de carteira" como um valor único — pra isso, use o campo `total` da resposta
paginada (não a contagem de `data`, que é só a página atual).

---

## 5. Cron/scheduler: nada bloqueado aqui, se quiserem hospedar o job aqui

O ponto do relatório sobre "não existe scheduler/cron" é sobre o **projeto
consumidor** (`/dashboard-new`), não sobre este serviço — aqui já existe
infraestrutura de cron via BullMQ rodando (`sync-incremental-cron` a cada
30min, `sync-full-day-cron` às 23:55, ver `src/infrastructure/queue/`). Não é
um erro do relatório. Só como opção de arquitetura: se fizer sentido que o
snapshot diário da projeção (item `acuracia`) viva no SST em vez do app do
dashboard, a infra pra registrar esse job já existe e segue o mesmo padrão
dos crons atuais — é decisão de onde hospedar, não de criar do zero.

---

## Resumo — o que muda na implementação do consumidor

| Onde                                    | O que corrigir/confirmar                                                                                                                                                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resumoPorPeriodo`/`miniKpis`           | `painel=FILIAL` é uma escolha de negócio válida — não está "subestimando" frente a `AMBOS`, que não soma nada (devolve os dois separados). Se quiser Filial+Representante combinado, é preciso somar os dois client-side.                             |
| `rankingPorMes` (Top Agências)          | Já é Filial-only (`mpd=0` fixo) e já é 100% aéreo (só `pub_sica.bilhete`) — pode remover as duas ressalvas do código/documentação e afirmar como fato, não aproximação. `situacao` é sempre ATIVOS, não configurável.                                 |
| `fornecedoresPorMes` (Top Fornecedores) | Mesma coisa: Filial-only, ATIVOS fixo. Bug do código IATA é gap de dado na base SICA, não falta de lógica — portar o mapa `SIGLA_TO_NOME` do CRM antigo como fallback de exibição.                                                                    |
| `nacionalInternacionalPorMes`           | Mesma coisa: Filial-only, ATIVOS fixo.                                                                                                                                                                                                                |
| `intraday`                              | Usar `GET /api/resumos/aereo?createdAtStart=&createdAtEnd=` (não `/api/bilhete/aereo`, que não tem timestamp) — campo `created_at` por registro; agrupamento em buckets de 15min continua sendo trabalho do client, endpoint é paginado e não agrega. |
| `conversao`                             | `base-empresa-cadastro` devolve lista paginada — usar o campo `total` da paginação como denominador de carteira, não contar `data`.                                                                                                                   |
