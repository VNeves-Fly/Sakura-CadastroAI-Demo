# Resposta ao levantamento do `mock-exec.md` — o que já existe no SSTService

Este doc cruza o pedido de `docs/infos/mock-exec.md` (dashboard `/crm/executivos/:id`) com o estado real do backend hoje. Não é uma nova spec — é o resultado de investigar o código (queries, routes, schema espelhado do SICA) pra saber, campo a campo, o que já pode sair do mock.

> `docs/crm-backend.md`, referenciado várias vezes pelo `mock-exec.md` (§3, §4, decisões de negócio), **não existe neste repositório**. As "8 decisões já listadas" e o model `Venda` que ele propõe não estão documentados em lugar acessível daqui — só existe `docs/infos/CRM.md`, que documenta o dashboard admin atual (`/admin/n`), não este dashboard de executivo.

---

## 1. Endpoints existentes e filtro por `codigoExecutivo`

Todos os endpoints abaixo já existem no SSTService. Os que suportam filtro por executivo usam consistentemente o mesmo parâmetro (`codigoExecutivo`) — não há nomenclatura divergente entre eles, o que facilita reaproveitar direto no controller do dashboard.

| Endpoint                                 | Filtra por executivo? | Prova (file:line)                                                                                                         |
| ---------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/reports/base-executivo-gestor` | ✅ `codigoExecutivo`  | `queries/executivoGestor.ts:33` — `WHERE p.codpes = ${filters.codigoExecutivo}`                                           |
| `GET /api/agencias/top`                  | ✅ `codigoExecutivo`  | `queries/topAgencias.ts:24` — `WHERE v.codprom = ${filters.codigoExecutivo}`                                              |
| `GET /api/consolidado/overview`          | ✅ `codigoExecutivo`  | `consolidado.routes.ts:595-606`                                                                                           |
| `GET /api/consolidado/dinamico`          | ✅ `codigoExecutivo`  | `consolidado.routes.ts:794` — pula a fonte SIGOT quando esse filtro é usado (SIGOT não tem coluna de promotor)            |
| `GET /api/reports/base-empresa-cadastro` | ✅ `codigoExecutivo`  | `queries/empresaCadastro.ts:188` — `WHERE e.codprom = ${filters.codigoExecutivo}`                                         |
| `GET /api/reports/ranking-gestores`      | ❌ Não aceita         | `queries/rankingGestores.ts:16-38` — endpoint já é um ranking _agregado por_ executivo, não faz sentido filtrar por um só |
| `GET /api/agencias/cadastro`             | ❌ Não aceita         | `queries/agencia.ts:47-99` — consulta TravelLink, não SICA; só filtra por `codigoEmpresa`/`cnpj`/`nome`/`iata`            |

**Nenhum desses endpoints monta o shape completo de `ExecutivoDetalheView` sozinho** — o controller do dashboard precisaria compor dados de vários deles (ou de queries novas sobre as mesmas tabelas).

---

## 2. Tabelas/entidades reais por trás dos "models" do mock

O `mock-exec.md` fala em `Promotor`, `Gestor`, `Agencia`, `Venda`, `Fornecedor`, `HistoricoConsultaCredito` como se fossem models formais. Na prática, tudo é espelhado do SICA via SQL cru — não existem esses models como entidades no schema do SSTService. Mapeamento real:

| Nome no mock                | Tabela real                                                   | Campos confirmados                                                                                                        | Observação                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Promotor`                  | `pub_sica.pessoal`                                            | `codpes` (id), `apelido`/`nome`                                                                                           | `email`, `sica`, `bases` **não são colunas diretas** dessa tabela — precisam de fonte extra                                                                                      |
| `Gestor`                    | —                                                             | —                                                                                                                         | **Não existe FK** `Promotor.gestorId → Gestor`. É mapeamento estático fora do banco (`DATA_DICTIONARY.md:88`)                                                                    |
| `Agencia`                   | `pub_sica.empresa`                                            | `codemp` (id), `nome` (razaoSocial), `cnpj`, `ativo` (status), `datacad` (createdAt)                                      | `executivoId` não existe como relação nomeada — o que existe é `empresa.codprom` (executivo dono da empresa)                                                                     |
| `Venda`                     | `pub_sica.venda` (+ `bilhete` p/ aéreo, `vdter` p/ terrestre) | `numvend`, `data` (emitidoEm), `codemp` (agenciaId), `cancelado`                                                          | Campos do mock (`canal`, `tipoAereo`, `fornecedorId`, `valorBruto`) existem mas **espalhados** em colunas de `bilhete`/`vdter`, não consolidados numa única tabela `Venda`       |
| `Fornecedor`                | `pub_sica.ciaaerea`                                           | `codcia`, `nomecia`, `codfor` (IATA)                                                                                      | Já usado em `queries/rankingCias.ts`                                                                                                                                             |
| `HistoricoConsultaCredito`  | —                                                             | —                                                                                                                         | **Não existe.** O que existe é `histcred` — histórico de **limite** de crédito (faturado/cartão), não de consulta AMAT/SOFIA. Confirma a distinção que o `mock-exec.md` já fazia |
| Limite de crédito comercial | `histcred.limcred` + `limadic`/`limadcc`                      | Já exposto hoje via `GET /api/reports/base-empresa-cadastro` (`limite_cred_faturado`, `total_limite_cred_faturado`, etc.) | É limite de **pagamento** (faturado/cartão), não de "compra comercial" — o bloqueio apontado pelo mock-exec.md (§3.1) permanece: não é o mesmo conceito                          |

---

## 3. Campo a campo do `ExecutivoDetalheView` — o que dá pra tirar do mock hoje

Usando a mesma numeração de seções do `mock-exec.md`.

### `perfil`

| Campo                                   | Já sai do mock?                       | Fonte real                                                                                                                       |
| --------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `nome`                            | ✅ Sim                                | `pessoal.codpes`, `.apelido`/`.nome`                                                                                             |
| `email`, `sica`, `bases`                | ❌ Ainda não                          | Não são colunas de `pessoal` — precisa achar fonte (talvez outra tabela SICA ou cadastro externo)                                |
| `gestorNome`                            | ❌ Ainda não                          | Sem FK; mapeamento estático fora do banco, precisa ser replicado/exposto                                                         |
| `totalAgencias`                         | ✅ Sim (via query nova)               | `COUNT(empresa.codprom = codigoExecutivo)` — já dá pra fazer com o filtro existente                                              |
| `vendendoUltimos30d`/`Pct`              | 🟡 Dá pra construir                   | `venda.data` + `venda.codemp` filtrando pela carteira — precisa de query nova, mas as tabelas existem                            |
| `conquistas.*` (faixas 10k/100k/1m/10m) | 🟡 Dá pra construir, decisão pendente | Precisa somar `venda` por `agenciaId`, mas falta decidir a janela (ano civil? 12m?) — decisão #2 do mock-exec.md ainda em aberto |

### `dashboard.hero`, `.kpis`, `.tendencia30d`, `.vendasMensais`

| Campo                                                                                | Já sai do mock?             | Fonte real                                                                                                                                                                         |
| ------------------------------------------------------------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valor`/`bilhetes` por período, série mensal, série 30d                              | 🟡 Dá pra construir         | `SUM`/`COUNT` sobre `venda` + `bilhete`/`vdter`, filtrando `codemp IN (agências do executivo)` — mesma lógica já usada em `queries/consolidado.ts`, só falta o filtro por carteira |
| `variacaoPct`, `projecaoFimMes`                                                      | ❌ Ainda não                | Precisa de algoritmo de projeção definido (decisão pendente, mesma do dashboard geral)                                                                                             |
| Derivados (`mesAnteriorFaltaValor`, `ticketMedio30d`, `vendasMensaisTotalAno`, etc.) | ✅ Não precisam vir prontos | Deriváveis no front a partir dos valores reais acima                                                                                                                               |

### `dashboard.miniStats`

| Campo                           | Já sai do mock?                       | Fonte real                                                                                                        |
| ------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `agencias`, `vendendo30d`/`Pct` | ✅/🟡 Igual ao item de `perfil` acima | —                                                                                                                 |
| `ociosasLimite`, `comCredito`   | ❌ **Bloqueado**                      | Mesmo bloqueio conceitual: `histcred` é limite de pagamento, não "limite de crédito comercial" que o front espera |

### `dashboard.fidelidadePorCompanhia`

| Campo                      | Já sai do mock?     | Fonte real                                                                                                        |
| -------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `quantidade` por companhia | 🟡 Dá pra construir | `ciaaerea` + `bilhete.codfor`, já usado em `queries/rankingCias.ts` — só falta filtrar pela carteira do executivo |

### `dashboard.crossCanal`

| Campo                           | Já sai do mock?     | Fonte real                                                                                           |
| ------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `ativasUltimos12m`              | 🟡 Dá pra construir | `venda`/`vdter`/`bilhete` filtrando por `codemp` da carteira, 12 meses                               |
| `volAereo`/`volTerrestre`       | 🟡 Dá pra construir | Já existe distinção aéreo (`bilhete`) vs terrestre (`vdter`) em `consolidado.ts`                     |
| `soAereo`/`soTerrestre`/`ambos` | 🟡 Dá pra construir | Mesma fonte, precisa de query de classificação por agência (não existe pronta, mas dado-base existe) |

### `dashboard.saudeCarteira`

| Campo                | Já sai do mock?  | Fonte real                                                                                                    |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Todos os 4 segmentos | ❌ **Bloqueado** | Cruza venda (disponível) com crédito (limite de pagamento ≠ limite de compra) — mesmo bloqueio de `miniStats` |

### `dashboard.topAgenciasMes`/`Ano`

| Campo                          | Já sai do mock?                  | Fonte real                                                                                                                                     |
| ------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Ranking (posição, nome, valor) | ✅ **Já existe endpoint pronto** | `GET /api/agencias/top` já filtra por `codigoExecutivo` (`topAgencias.ts:24`) — é praticamente a query pedida, só confirmar se cobre mês E ano |

### `dashboard.paradasComHistorico` / `.emQueda`

| Campo                                    | Já sai do mock?                         | Fonte real                                                                                             |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Paradas (`volume365d`, `diasSemComprar`) | 🟡 Dá pra construir                     | `venda.data` por agência da carteira — falta só a query com o threshold (90/180 dias, ainda em aberto) |
| Em queda (`mediaMensal12m`, `quedaPct`)  | 🟡 Dá pra construir, threshold pendente | Mesma fonte de dados; falta decisão de negócio (decisão #3 do mock-exec.md)                            |

---

## 4. O que continua de fato bloqueado (não é falta de dado no banco, é falta de decisão/modelo)

1. **Limite de crédito comercial** — dado existente (`histcred`, `limadic`/`limadcc`) é sobre limite de pagamento, não limite de compra. Trava `miniStats.ociosasLimite/comCredito` e todo `saudeCarteira`.
2. **`Gestor.nome`** — sem FK real; é mapeamento estático fora do banco. Precisa decidir onde/como expor isso via API.
3. **`perfil.email`/`.sica`/`.bases`** — não são colunas de `pessoal`; precisa achar a fonte real (outra tabela ou cadastro externo).
4. **Janela de "conquistas"** e **threshold de "em queda"** — decisões de negócio em aberto, não bloqueio técnico.
5. **`docs/crm-backend.md`** — está ausente do repo; se ele tiver decisões já tomadas (as "8 decisões" citadas), preciso ser encontrado ou recriado antes de fechar o modelo de `Venda` consolidado.

---

## 5. Resumo em uma frase

Boa parte dos dados de **venda, agência e ranking por executivo já existe e já filtra por `codigoExecutivo`** (`agencias/top`, `consolidado/overview`, `consolidado/dinamico`, `base-empresa-cadastro`, `base-executivo-gestor`) — o trabalho que falta é majoritariamente **compor essas fontes numa query nova por carteira** (agência × executivo) e **resolver as decisões de negócio pendentes**, não criar tabelas do zero. O único bloqueio genuinamente técnico é o conceito de limite de crédito comercial, que não existe no schema espelhado do SICA.
