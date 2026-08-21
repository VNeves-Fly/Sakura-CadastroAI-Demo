# Backend necessário para o Dashboard do Executivo (`/crm/executivos/:id`)

Levantamento do que o backend precisa entregar pra substituir o mock de `src/modules/atribuicoes/adapters/executivo-detalhe.adapter.ts` por dados reais, sem quebrar o contrato que o front já consome.

> Front-end de referência: `src/modules/atribuicoes/types/executivo-detalhe.types.ts` (contrato de dados, `ExecutivoDetalheView`), `adapters/executivo-detalhe.adapter.ts` (função `montarExecutivoDetalheView` — todo número que precisa virar real está gerado ali por `hashParaNumero(promotor.id)`, sempre determinístico pra não "piscar" entre reloads).
>
> Ver também `docs/crm-backend.md` — propõe um model `Venda` (por `agenciaId`, com `canal`/`tipoAereo`/`fornecedorId`/`valorBruto`/`emitidoEm`) pro Dashboard de Vendas geral. **Esta página é a mesma métrica, só filtrada pela carteira de um executivo** (`Agencia.executivoId = promotor.id`) — não desenhar uma segunda tabela de vendas; reaproveitar o mesmo model, só mudando o filtro/agrupamento da query.

---

## 1. Já é real hoje (não precisa mudar)

| Campo                                                                      | Fonte                                                |
| -------------------------------------------------------------------------- | ---------------------------------------------------- |
| `perfil.id`, `.nome`, `.email`, `.sica`, `.bases`                          | `Promotor`                                           |
| `perfil.gestorNome`                                                        | `Promotor.gestorId` → `Gestor.nome`                  |
| `perfil.totalAgencias`                                                     | `COUNT(Agencia.executivoId = promotor.id)`           |
| `dashboard.miniStats.agencias`                                             | = `perfil.totalAgencias`                             |
| `dashboard.crossCanal.aprovadas`                                           | = `perfil.totalAgencias`                             |
| Nome/CNPJ/status/data de criação de cada agência citada em rankings/listas | `Agencia.razaoSocial`/`.cnpj`/`.status`/`.createdAt` |

Tudo o resto abaixo é **mock determinístico** — nenhuma agregação de venda, crédito ou visita existe hoje ligada a `Promotor`/`Agencia`.

---

## 2. Mapa campo a campo — mock atual → o que o backend precisa expor

### `perfil`

| Campo                                | Fórmula mock atual                                        | O que precisa vir real                                                                                                                                            |
| ------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vendendoUltimos30d` / `Pct`         | `totalAgencias * (0.3~0.8 aleatório por hash)`            | `COUNT(DISTINCT agenciaId)` com `Venda.emitidoEm >= hoje-30d`, dentro da carteira do executivo                                                                    |
| `conquistas.agencias10k/100k/1m/10m` | Particiona `totalAgencias` em 4 faixas por peso aleatório | `COUNT` de agências da carteira cujo **acumulado anual** de venda cruza cada faixa (10k/100k/1M/10M) — precisa decisão: acumulado do ano civil? últimos 12 meses? |
| `conquistas.agenciasSemVenda`        | Idem, resto da partição                                   | `COUNT` de agências da carteira sem nenhuma `Venda` no período de referência                                                                                      |

### `dashboard.hero` (card principal, períodos dia/ontem/mês/ano)

| Campo                           | Fórmula mock atual                                                                                    | O que precisa vir real                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `valor`, `bilhetes` por período | Deriva tudo de um `valorMesAtual` sintético (`((base % 900) + 80) * 25_000`), fatiado por dias do mês | `SUM(valorBruto)` / `COUNT` de `Venda` da carteira do executivo, agrupado por dia/ontem/mês/ano |
| `agenciasVendendo`              | Fração de `vendendoUltimos30d`                                                                        | `COUNT(DISTINCT agenciaId)` com venda no período                                                |
| `variacaoPct`                   | `((base % 40) - 20) / 10` — número solto                                                              | Comparação vs. mesmo período anterior (ex.: mesmo dia do mês anterior)                          |

### `dashboard.kpis`

| Campo                            | Fórmula mock atual                         | O que precisa vir real                                                                                                                                                |
| -------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mesAnteriorValor`               | `valorMesAtual * (0.85~1.15)`              | `SUM(valorBruto)` do mês anterior completo, carteira do executivo                                                                                                     |
| `mesAnteriorFaltaValor`          | `max(0, mesAnteriorValor - valorMesAtual)` | Derivável no front a partir dos dois valores reais — **não precisa vir pronto**                                                                                       |
| `mesAnteriorPercentualAtingido`  | `valorMesAtual / mesAnteriorValor * 100`   | Idem, derivável — **não precisa vir pronto**                                                                                                                          |
| `projecaoFimMes`                 | `valorMesAtual * (1.15~1.35)`              | Mesmo problema de projeção do dashboard geral (`docs/crm-backend.md` §4) — precisa de algoritmo definido (histórico por dia da semana, N semanas, faixa de confiança) |
| `acumuladoAnoValor` / `Bilhetes` | `valorMesAtual * multiplicador(6~12)`      | `SUM`/`COUNT` de `Venda` do ano civil, carteira do executivo                                                                                                          |
| `ticketMedio30d`                 | `valorMesAtual / bilhetesMes`              | Derivável (`valor / qtd`) a partir dos reais acima — **não precisa vir pronto**                                                                                       |

### `dashboard.miniStats`

| Campo                 | Fórmula mock atual            | O que precisa vir real                                                                                                                                                                                                                |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vendendo30d` / `Pct` | = `perfil.vendendoUltimos30d` | Mesmo dado do item 1                                                                                                                                                                                                                  |
| `ociosasLimite`       | `totalAgencias * (0.05~0.20)` | **Bloqueado**: não existe conceito de "limite de crédito comercial" em `Agencia` hoje (`HistoricoConsultaCredito` é sobre consulta de crédito AMAT/SOFIA no cadastro, não limite de compra) — precisa decisão de produto + campo novo |
| `comCredito`          | `totalAgencias * (0.4~0.8)`   | Mesmo bloqueio acima                                                                                                                                                                                                                  |

### `dashboard.fidelidadePorCompanhia`

| Campo                      | Fórmula mock atual                           | O que precisa vir real                                                                                                                            |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quantidade` por companhia | `3 + hash % 40`, lista fixa de 13 companhias | `COUNT(DISTINCT agenciaId)` por `fornecedorId` (companhia aérea) na carteira — depende do model `Fornecedor` proposto em `docs/crm-backend.md` §3 |
| `destaque`                 | A de maior `quantidade`                      | Derivável no front — **não precisa vir pronto**                                                                                                   |

### `dashboard.vendasMensais` / `vendasMensaisTotalAno` / `VariacaoAlta/BaixaPct`

| Campo                                               | Fórmula mock atual                                              | O que precisa vir real                                                                     |
| --------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Série mensal `nacional`/`internacional`/`terrestre` | Gerada mês a mês a partir de `valorMesAtual` com ruído por hash | `SUM(valorBruto)` por mês × `canal`/`tipoAereo`, ano corrente, carteira do executivo       |
| `vendasMensaisTotalAno`                             | = `acumuladoAnoValor`                                           | Derivável (soma da série) — **não precisa vir pronto**                                     |
| `VariacaoAltaPct`/`BaixaPct`                        | Números soltos por hash                                         | Derivável no front (maior alta/queda mês a mês da série real) — **não precisa vir pronto** |

### `dashboard.tendencia30d` / `Total`

| Campo               | Fórmula mock atual                  | O que precisa vir real                                            |
| ------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| 30 valores diários  | `mediaDiaria * (0.4~1.6 aleatório)` | `SUM(valorBruto)` por dia, últimos 30 dias, carteira do executivo |
| `tendencia30dTotal` | = `valorMesAtual`                   | Derivável (soma dos 30 valores) — **não precisa vir pronto**      |

### `dashboard.crossCanal`

| Campo                                                                        | Fórmula mock atual                                                                          | O que precisa vir real                                                                                                |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ativasUltimos12m`                                                           | `totalAgencias * (0.4~0.8)`                                                                 | `COUNT(DISTINCT agenciaId)` com venda nos últimos 12 meses                                                            |
| `volAereo` / `volTerrestre`                                                  | `valorMesAtual * 0.92` / `* 0.03` (proporção fixa!)                                         | `SUM(valorBruto)` por `canal`, mês atual                                                                              |
| `soAereo` / `soTerrestre` / `ambos` (`quantidade`, `pct`, lista de agências) | Partição aleatória de `ativasUltimos12m` + nomes/CNPJs sintéticos (`PREFIXOS_AGENCIA_MOCK`) | `COUNT`/lista de agências que compraram só aéreo, só terrestre, ou ambos nos últimos 12m — `pct` é derivável no front |

### `dashboard.saudeCarteira` (4 segmentos: ativas/potenciais/ociosas/inativas)

| Campo                                 | Fórmula mock atual                                             | O que precisa vir real                                                                                                                                                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `quantidade`/`pct`/lista por segmento | Partição aleatória de `totalAgencias` + nomes/CNPJs sintéticos | Mesma decisão #2 do `docs/crm-backend.md` ("saúde" não tem fórmula definida na spec) — aqui agrava porque cruza **venda** com **crédito** (`ativas c/ crédito`, `potenciais s/ limite`, `ociosas limite parado`), e crédito não existe no schema (ver bloqueio de `miniStats` acima) |

### `dashboard.topAgenciasMes` / `topAgenciasAno`

| Campo                          | Fórmula mock atual                                 | O que precisa vir real                                                                                                                                                                    |
| ------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ranking (posição, nome, valor) | `hashParaNumero(agencia.id)` por agência, ordenado | `SUM(valorBruto)` por `agenciaId` no mês/ano, `ORDER BY valor DESC LIMIT 20`, carteira do executivo — mesma query de `docs/crm-backend.md §5, 4.10`, só com filtro extra de `executivoId` |

### `dashboard.paradasComHistorico`

| Campo                                              | Fórmula mock atual                                                     | O que precisa vir real                                                                                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lista (nome, cnpj, `volume365d`, `diasSemComprar`) | Filtra 1 a cada 3 agências por `(base + indice) % 3`, valores por hash | Agências da carteira com `volume365d > 0` mas `diasSemComprar > 90` (mesmo threshold em aberto do `docs/crm-backend.md` decisão #7) — `ORDER BY diasSemComprar DESC LIMIT 20` |

### `dashboard.emQueda`

| Campo                                                     | Fórmula mock atual                           | O que precisa vir real                                                                                                                                                                         |
| --------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lista (nome, `mediaMensal12m`, `vendasAtual`, `quedaPct`) | Filtra 1 a cada 4 agências, valores por hash | `AVG(valorBruto)` mensal dos últimos 12m vs. mês atual, por agência da carteira, onde `quedaPct` (queda vs. média) passa de um threshold — **threshold não definido**, decisão de produto nova |

---

## 3. Decisões de negócio novas (além das 8 já listadas em `docs/crm-backend.md` §4)

1. **Limite de crédito comercial não existe no schema.** Bloqueia `miniStats.ociosasLimite`, `.comCredito` e o próprio conceito de "ativas c/ crédito" / "potenciais s/ limite" / "ociosas (limite parado)" em `saudeCarteira`. Precisa de um campo novo (provavelmente vindo de sistema financeiro externo, mesmo padrão de "cenário A" do `docs/crm-backend.md` §1) antes de qualquer query.
2. **Janela de "conquistas" (`agencias10k/100k/1m/10m`)** — acumulado de qual período? Ano civil corrente, últimos 12 meses corridos, ou desde o início do relacionamento com o executivo? Muda o `GROUP BY`/filtro de data.
3. **Threshold de "em queda"** — `emQueda` não tem regra na spec (ao contrário de "parada", que tem o corte de 90/180 dias do dashboard geral). Precisa definir: queda de quantos % vs. média de quantos meses conta como "em queda"?
4. **Fidelidade por companhia depende do model `Fornecedor`** proposto em `docs/crm-backend.md` — se aquele model ainda não for aprovado/criado, esta seção também fica bloqueada.

---

## 4. Contrato de dados (shape que o backend precisa alimentar)

Igual ao padrão do dashboard geral: só a camada de dados muda (adapter → serviço real), `ExecutivoDetalheView` continua igual e a página/componentes não mudam.

```ts
type ExecutivoDetalheView = {
  perfil: ExecutivoPerfil; // ver types/executivo-detalhe.types.ts:24
  dashboard: ExecutivoDashboard; // ver types/executivo-detalhe.types.ts:135
};
```

Sugestão: um único `ExecutivoDetalheController.buscarDetalhe(promotorId)` chamado direto do `page.tsx` (mesma filosofia do resto do app — Server Component, sem round-trip client-side), retornando o shape completo pra não fatiar em N chamadas.

---

## 5. Checklist pra destravar a implementação

- [ ] Aprovar/criar o model `Venda` (+ `Fornecedor`) proposto em `docs/crm-backend.md` §3 — é a base de quase todos os campos aqui.
- [ ] Resolver as 8 decisões de `docs/crm-backend.md` §4 (compartilhadas com esta página).
- [ ] Resolver as 4 decisões novas da seção 3 acima (limite de crédito é a mais bloqueante — trava 2 seções inteiras).
- [ ] Confirmar se o front deriva `pct`/`variacaoPct`/totais (marcados "não precisa vir pronto" acima) ou se o backend prefere devolver pronto mesmo assim.
- [ ] Implementar a query filtrando por `Agencia.executivoId = promotor.id` (reaproveitar 100% da modelagem do dashboard geral, só mudando o filtro).
