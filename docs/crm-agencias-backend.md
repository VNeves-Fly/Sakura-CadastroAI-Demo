# Backend de `/crm/agencias` — de onde vêm os dados

Referência de como o backend hoje busca, monta e entrega os dados de `/crm/agencias` (listagem + modal de detalhe), pra reconciliar com o novo layout do front. Este doc descreve **comportamento atual do backend** (contrato de dados, endpoints, fallbacks) — não o visual. Os tipos em `src/modules/agencias-crm/types/` são o contrato: o novo front deve consumir o shape de lá, não inventar um novo.

> Decisão-chave (2026-08-21, pedido do usuário): **nem a listagem nem o modal de detalhe do CRM tocam a tabela local `agencias`** (model `Agencia`, o funil de cadastro/onboarding deste app). Tudo aqui vem do roster comercial do SST (`sst.flysakura.com`), com só duas exceções pontuais de dado organizacional local (explicadas na seção 4). Isso é diferente da aba "Agências" do **Gestor** (`src/modules/gestores/`), que continua lendo a tabela `Agencia` normalmente — não faz parte deste doc.

---

## 1. Visão geral — dois fluxos independentes

```
/crm/agencias (listagem)                    Modal de detalhe (on-demand)
├─ page.tsx dispara o loader sem await       ├─ clique na linha → GET /api/agencias-crm/:id
├─ Suspense + skeleton enquanto carrega      ├─ :id decide o caminho:
├─ carrega a carteira INTEIRA de uma vez     │   • só dígitos  → código SICA → 100% SST
├─ filtro/ordenação/paginação: 100% client   │   • cuid        → dossiê local (fora de escopo aqui)
└─ nenhuma paginação real no banco/API       └─ cada abertura de modal = chamadas novas ao SST
```

As duas telas **não compartilham fetch** — abrir o modal de uma agência não reaproveita nada que a listagem já buscou (exceto o cache de 10min do SST, que é por processo, não por sessão).

---

## 2. Listagem — `/crm/agencias`

### 2.1 Fluxo

```
page.tsx
  └─ carregarAgenciasCarteira()                     [agencia-carteira.loader.ts]
       ├─ obterRosterOuVazio()                       → GET /api/agencias/ativas (SST, paginado)
       ├─ atribuicoesAdminController.listarPromotores()   → banco local (Promotor)
       ├─ atribuicoesAdminController.listarGestores()     → banco local (Gestor)
       ├─ basesController.list()                          → banco local (Base)
       └─ obterMetricasReaisOuNull()                  → GET /api/consolidado/air/resumo-agrupado
                                                          GET /api/resumos/terrestre (SST, paginado)
  └─ montarAgenciasCarteiraViewList(...)             [agencia-carteira.adapter.ts]
       → funde roster + métricas + Promotor/Gestor/Base em AgenciaCarteiraView[]
```

Tudo isso roda **uma vez por carregamento de página**, no servidor (`carregarAgenciasCarteira()` é disparado sem `await` em `page.tsx`; o `Suspense` mostra `AgenciasListaSkeleton` até resolver). Depois de resolvido, **a carteira inteira fica em memória no client** — busca, filtros, ordenação e paginação (`use-agencias-carteira.view-model.ts`) são 100% client-side, sem nenhuma chamada de rede nova. Não existe paginação real no banco/API para esta listagem.

### 2.2 Endpoints do SST usados

| Endpoint                                   | Parâmetros                                                                     | O que traz                                                                                                                                                                                                                                       | Onde                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `GET /api/agencias/ativas`                 | `page`, `limit` (500/página, **sem** `codigoExecutivo`)                        | Roster comercial inteiro: `codigo_empresa`, `nome`, `cnpj`, `empresa_status`, `codigo_executivo`, `nome_executivo`. Paginado internamente (bounded concurrency, 15 em paralelo) até cobrir `total` (~21 mil linhas no dataset real, ~43 páginas) | `agencia-carteira.sst-service.ts` → `buscarRosterCarteira()`            |
| `GET /api/consolidado/air/resumo-agrupado` | `agruparPor=codigoEmpresa`, `startDate`, `endDate` (**sem** `codigoExecutivo`) | Uma linha por agência que vendeu no período (aéreo), com `ticket_medio`/`data_ultima_venda` prontos. Chamado 2x (janela de 365d e janela mês-a-data)                                                                                             | `agencia-carteira.sst-service.ts` → `buscarAereoAgrupadoCarteira()`     |
| `GET /api/resumos/terrestre`               | `startDate`, `endDate`, `page`, `limit=500`                                    | Vendas terrestres brutas (uma linha por venda); reduzido no próprio código pra um mapa por `codigo_cliente`. Paginado (~120 páginas/ano no dataset real)                                                                                         | `agencia-carteira.sst-service.ts` → `buscarTerrestreAgrupadoCarteira()` |

Todas as chamadas ao SST usam o client compartilhado (`agencia-sst-client.util.ts`): cache de 10min (memória + Valkey se `VALKEY_URL` configurada), retry (3x) só em 5xx/timeout, timeout de 20s por request.

### 2.3 Comportamento sem `SST_API_KEY` (ou se o SST falhar)

- **Roster** (identidade das agências): cai pra **lista vazia**. Não existe fonte alternativa de identidade de agência — não fabrica linha mock (mesmo critério já usado pra `agenciasCarteira` da aba do executivo). A listagem mostra "Nenhuma agência encontrada com esses filtros."
- **Métricas de venda** (bilhetes/vendas/ticket médio/canal/última compra): cai pra **mock determinístico por hash** — a listagem continua populada (com nomes/CNPJ/status reais do roster), só os números de venda ficam fake, seedados por `codigoEmpresa`.
- As duas falhas são independentes: dá pra ter roster real + métricas mock, mas nunca métricas reais sem roster (o roster é o esqueleto da lista).

⚠️ **Achado durante verificação**: já foi observado o roster voltar vazio numa tentativa e completo (~30-50s depois) na tentativa seguinte — sugere uma falha intermitente numa das ~43 páginas sendo engolida silenciosamente. Se o novo front não tiver um estado de "tentar de novo" pra lista vazia, vale considerar adicionar.

### 2.4 Origem de cada campo — `AgenciaCarteiraView`

(tipo completo em `src/modules/agencias-crm/types/agencia-carteira.types.ts`)

| Campo                                                                          | Origem         | Observação                                                                                                                |
| ------------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`                                                                           | SST            | `String(codigo_empresa)`                                                                                                  |
| `razaoSocial`                                                                  | SST            | `nome` do roster                                                                                                          |
| `cnpj`                                                                         | SST            | dígitos puros, como o SST devolve                                                                                         |
| `status`                                                                       | SST            | `empresa_status`: `"ativo"` \| `"inativo"` (não é mais o enum de onboarding `StatusAgencia`)                              |
| `reprovadaOuInativa`                                                           | SST            | `status !== "ativo"`                                                                                                      |
| `dadosFaltantes`                                                               | —              | **sempre `false`** — conceito era ligado ao funil de onboarding, sem equivalente no SST                                   |
| `executivoId`                                                                  | Local          | `Promotor.id`, casado via `Promotor.sica === codigo_executivo` do SST. `null` se não achar Promotor local com esse SICA   |
| `executivoNome`                                                                | SST + Local    | `Promotor.nome` quando há match local; senão o `nome_executivo` que o próprio SST devolveu                                |
| `gestorNome`                                                                   | Local          | via `Promotor.gestorId → Gestor.nome`, só quando há match de `executivoId`                                                |
| `base`                                                                         | Local          | primeira `Promotor.bases[0]`, só quando há match de `executivoId` — "melhor esforço", não uma base real da agência        |
| `regiao`                                                                       | Local          | derivada de `Base.uf` (`regiao-por-uf.util.ts`) a partir da `base` acima                                                  |
| `categoria` (premiação)                                                        | —              | mock por hash (`codigoEmpresa`) — SST não tem endpoint de faixa de premiação                                              |
| `canal`, `bilhetes`, `ticketMedio`, `vendasMes`, `vendasAno`, `diasSemComprar` | SST (métricas) | de `obterMetricasCarteira()` quando a agência tem venda detectada nos endpoints da seção 2.2; mock por hash como fallback |
| `limite`                                                                       | —              | mock, calculado sobre `vendasAno` — SICA só espelha limite de crédito de fatura, não limite de compra                     |

### 2.5 Filtros/ordenação (`AgenciasCarteiraFiltros`, `use-agencias-carteira.view-model.ts`)

Todos client-side, sobre a lista já carregada. **Alguns campos existem na UI mas não filtram nada** (herdados de antes desta integração):

- `situacaoReceita` — sem fonte de Receita Federal em lote nesta listagem.
- `dadosFaltantes` — sempre `false` em todo item (ver 2.4), então o filtro "Pendentes" nunca retorna nada hoje.

Os demais (`regiao`, `base`, `executivoId`, `gestorNome`, `canalVendas`, `premiacao`, `ultimaCompra`, `ordenarPor`, `ocultarInativadas`) filtram/ordenam de verdade sobre os campos da tabela acima. O atalho de busca `"críticos"` filtra por `diasSemComprar > 90`.

Removidos nesta rodada (não existem mais): abas de status "Todas/Aprovadas/Reprovadas+Inativas" e a opção de ordenar por "Cadastro (mais recente)" (`createdAt` não existe mais — não há data de cadastro de onboarding pra agências que nunca passaram por aqui).

---

## 3. Modal de detalhe — `GET /api/agencias-crm/:id`

### 3.1 Como o `:id` decide o caminho

`src/app/api/agencias-crm/[id]/route.ts` testa `/^\d+$/` (só dígitos):

- **Só dígitos → código SICA** (veio de uma linha de `/crm/agencias` ou da aba "Agências" do executivo, onde `id`/`a.id` já É o código SICA, `String(codigo_empresa)`) → caminho 100% SST (`responderDetalheSst`).
- **Não é só dígitos → cuid local** (aba "Agências" do Gestor, ou qualquer link direto com o id real de uma agência que passou pelo cadastro aqui) → caminho antigo, local (`responderDetalheLocal`), **inalterado**, fora do escopo deste doc.

Sem `SST_API_KEY`, o caminho SST responde `503 "Integração com o SST não está configurada."` de propósito — não tem fonte alternativa pra essa listagem.

### 3.2 Caminho SST (`responderDetalheSst`) — endpoints usados

```
responderDetalheSst(codigoEmpresa)
  ├─ agenciaDetalheSstService.obterCadastroComercial(codigoEmpresa)
  │    ├─ GET /api/reports/base-empresa-cadastro?codigoEmpresa=X&limit=1   (1ª chamada)
  │    └─ GET /api/agencias/cadastro?cnpj=<CNPJ com máscara>&limit=1       (2ª chamada, encadeada — usa o CNPJ que a 1ª devolveu)
  ├─ atribuicoesAdminController.listarPromotores() / listarGestores()      (banco local — só p/ resolver Base/Gestor via Promotor.sica)
  └─ obterVendasComMetricasDaCarteira(String(codigoEmpresa))
       ├─ agenciaDetalheSstService.obterVendas(sicaCodigo)                 → ver tabela 3.3
       └─ agenciaCarteiraSstService.obterMetricasCarteira()                → mesmos endpoints da seção 2.2 (cacheados, reaproveita o cache se a listagem já rodou)
```

| Endpoint                                 | Parâmetros                                                                                                | O que traz                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/reports/base-empresa-cadastro` | `codigoEmpresa`, `limit=1`                                                                                | `nome_fantasia`, `CNPJ`, endereço, `codigo_executivo`/`nome_executivo`, `empresa_ativa` (SIM/NÃO), `data_cadastro`, `bloqueio_credito`, **limites de crédito reais** (`limite_cred_faturado`, `total_limite_cred_faturado`, `limite_cred_cartao_credito`, `total_limite_cred_cartao_credito`), condição de pagamento |
| `GET /api/agencias/cadastro`             | `cnpj` (⚠️ com máscara `00.000.000/0000-00`, não dígitos puros — `maskCnpj()` faz a conversão), `limit=1` | `razao_social`, `contato`, `telefone`, `email`, endereço mais completo, IE/IM/IATA/EMBRATUR                                                                                                                                                                                                                          |

Se `base-empresa-cadastro` não achar nada pra aquele código → `404 "Agência não encontrada."` (não tenta o segundo endpoint). Se achar mas `agencias/cadastro` não achar nada por CNPJ, segue só com os dados de `base-empresa-cadastro` (fallback dentro do adapter).

### 3.3 `agenciaDetalheSstService.obterVendas(sicaCodigo)` — bloco "Vendas"

Mesmos endpoints de antes desta rodada (inalterados):

| Endpoint                                                                                    | Uso                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/consolidado/air` (`codigoEmpresa`, `startDate`, `endDate`, `tipoRota=NAC\|INTER`) | Volume/bilhetes aéreo nacional e internacional (ano, mês atual, mês anterior) **e** Evolução Mensal (1 chamada por mês do ano corrente)                                                      |
| `GET /api/consolidado/non-air` (`codigoEmpresa`, `startDate`, `endDate`)                    | Volume/bilhetes terrestre — mesmos usos do endpoint acima (ano/mês/evolução mensal)                                                                                                          |
| `GET /api/resumos/aereo` (`codigoEmpresa`, paginado)                                        | Reservas recentes (aba "Reservas", janela de 14d, só 1ª página) **e** Top Rotas (janela de 90d, até 4 páginas/2000 bilhetes) — dois usos distintos, cada um com sua própria janela/paginação |
| `GET /api/resumos/terrestre` (`codigoEmpresa`)                                              | Reservas recentes, lado terrestre (janela de 90d)                                                                                                                                            |
| `GET /api/reports/ranking-cias` (`codigoEmpresa`)                                           | Top companhias aéreas                                                                                                                                                                        |
| `GET /api/agencias/faturas` (`codigoEmpresa`)                                               | Aba "Faturas"                                                                                                                                                                                |

Cada sub-bloco tem fallback isolado (`comFallback`) — uma chamada falhar não derruba as outras.

### 3.4 O que **não existe** no SST (fica vazio/null, não é bug)

Nenhum endpoint do SST modela: sócios/representantes legais, documentos (RG, procuração, contrato social), análise de risco cadastral (IA), dados da Receita Federal (CNAE, capital social, natureza jurídica, porte, Simples Nacional, situação cadastral), dados bancários. No caminho SST do modal:

- `dadosDocumentacao.socios` → `[]` (a UI já mostra "Nenhum sócio cadastrado.")
- `empresa.cnaePrincipal`/`cnaesSecundarios`/`capitalSocial`/`naturezaJuridica`/`porte`/`optanteSimples`/`situacaoReceita`/`dataAbertura`/`tempoDeCnpj`/`emailReceita`/`telefoneReceita` → `null` (UI mostra "—"/"Não consultado")
- `empresa.etapaLabel` → `null` (a UI só mostra o badge "Etapa" quando não é `null` — esse conceito é do wizard de onboarding, não existe fora dele)
- `perfilComercial.bancoNome`/`bancoCodigo`/`bancoAgencia`/`bancoConta` → `null` (UI mostra "Dados bancários não informados no cadastro.")
- `temRiscoCadastral` → sempre `false`

### 3.5 Origem de cada campo — caminho SST (`AgenciaDetalheView`)

| Campo                                                                  | Origem                                                                                                                                                     |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                                                   | `String(codigoEmpresa)`                                                                                                                                    |
| `identificador`                                                        | mock (`AG-` + primeira palavra da razão social)                                                                                                            |
| `categoria`                                                            | mock por hash (`codigoEmpresa`)                                                                                                                            |
| `temRiscoCadastral`                                                    | `false` (sempre)                                                                                                                                           |
| `ativoSistema`                                                         | SST — `empresa_ativa === "SIM"`                                                                                                                            |
| `ativadoEm`                                                            | SST — `data_cadastro` de `base-empresa-cadastro` (data real, não é mais aproximação)                                                                       |
| `dadosDocumentacao.empresa.{razaoSocial,cnpj,nomeFantasia}`            | SST — `agencias/cadastro.razao_social`/`cnpj` com fallback pra `base-empresa-cadastro.nome_chave`/`nome_fantasia`/`CNPJ`                                   |
| `dadosDocumentacao.empresa.{statusLabel,statusClasses}`                | derivado de `ativoSistema` ("Ativo"/"Inativo", classes de badge verde/vermelho)                                                                            |
| `dadosDocumentacao.contato.*`                                          | SST — `agencias/cadastro.contato`/`telefone`/`email`, fallback `base-empresa-cadastro.email_empresa`/`telefone_principal`                                  |
| `dadosDocumentacao.contato.telefone1Base`                              | Local — via `Promotor.sica` (mesma resolução de `base` abaixo)                                                                                             |
| `dadosDocumentacao.endereco`                                           | SST — `agencias/cadastro` (mais completo) com fallback pra `base-empresa-cadastro`                                                                         |
| `dadosDocumentacao.socios`                                             | `[]` sempre (ver 3.4)                                                                                                                                      |
| `perfilComercial.sica`                                                 | `String(codigoEmpresa)`                                                                                                                                    |
| `perfilComercial.base`, `.gestorNome`                                  | Local — via `Promotor.sica === codigoEmpresa` → `Promotor.bases[0]` / `Promotor.gestorId → Gestor.nome`. `null` se não houver Promotor local com esse SICA |
| `perfilComercial.executivoNome`                                        | Local (`Promotor.nome`) quando há match; senão `base-empresa-cadastro.nome_executivo`                                                                      |
| `perfilComercial.limiteFaturado`                                       | **SST real** — `total_limite_cred_faturado` (ou `limite_cred_faturado` se o total vier zerado)                                                             |
| `perfilComercial.limiteCartao`                                         | **SST real** — `total_limite_cred_cartao_credito` (idem)                                                                                                   |
| `perfilComercial.bloqCred`                                             | **SST real** — `bloqueio_credito === "SIM"`                                                                                                                |
| `perfilComercial.{segmento,mediaFaturamento,comissaoPct,incentivoPct}` | mock por hash                                                                                                                                              |
| `perfilComercial.{bancoNome,bancoCodigo,bancoAgencia,bancoConta}`      | `null` sempre                                                                                                                                              |
| `kpisTopo.{diasSemComprar,dataUltimaCompra}`                           | SST (seção 3.3), mock por hash como fallback                                                                                                               |
| `vendas.*`                                                             | SST (seção 3.3), mock por hash como fallback — **exceto** `riscoEmissao`, que é sempre mock (sem endpoint equivalente no SST)                              |

> Nota: no caminho **local** (cuid, aba do Gestor — fora de escopo, mas documentado por completude), esses mesmos campos vêm de `Agencia`/`DadosReceita`/`RepresentanteLegal`/`CadastroComplementar`/`AnaliseIaAgencia` — ver comentários em `agencia-detalhe.adapter.ts:montarAgenciaDetalheView` e `agencia-detalhe.types.ts`.

---

## 4. As duas únicas dependências do banco local no caminho SST

Só isso — nada de identidade/status/cadastro de agência vem do banco local no caminho SST:

1. **`Promotor.sica`** — chave de junção entre `codigo_executivo` do SST e a hierarquia local Executivo→Gestor (`Promotor.gestorId → Gestor`). O SST não modela "Gestor"; sem esse match, `base`/`gestorNome`/`executivoId` (na listagem) ficam `null`, mas o resto do registro (nome, CNPJ, status, vendas, limites) continua vindo normal.
2. **`Base.uf`** (via `basesController.list()`, só na listagem) — resolve `regiao` a partir da `base` acima.

Se o front novo precisar reconciliar dados de organização (quem é o executivo/gestor de uma agência), é por aqui — não tem como pedir isso ao SST.

---

## 5. Mapa de arquivos

| Arquivo                                                                    | Papel                                                                                                                                   |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(admin)/crm/agencias/page.tsx`                                    | Entry point da listagem, dispara o loader sob Suspense                                                                                  |
| `src/modules/agencias-crm/services/agencia-carteira.loader.ts`             | Orquestra roster + métricas + Promotor/Gestor/Base pra listagem                                                                         |
| `src/modules/agencias-crm/services/agencia-carteira.sst-service.ts`        | Chamadas SST da listagem: roster (`/api/agencias/ativas`) + métricas (`/api/consolidado/air/resumo-agrupado`, `/api/resumos/terrestre`) |
| `src/modules/agencias-crm/adapters/agencia-carteira.adapter.ts`            | Funde tudo em `AgenciaCarteiraView`                                                                                                     |
| `src/modules/agencias-crm/types/agencia-carteira.types.ts`                 | Contrato de dados da listagem (`AgenciaCarteiraView`, filtros)                                                                          |
| `src/modules/agencias-crm/view-models/use-agencias-carteira.view-model.ts` | Filtro/ordenação/paginação client-side                                                                                                  |
| `src/app/api/agencias-crm/[id]/route.ts`                                   | Endpoint do modal — decide caminho SST vs local                                                                                         |
| `src/modules/agencias-crm/services/agencia-detalhe.sst-service.ts`         | Chamadas SST do modal: cadastro comercial (`base-empresa-cadastro`, `agencias/cadastro`) + vendas                                       |
| `src/modules/agencias-crm/adapters/agencia-detalhe.adapter.ts`             | Monta `AgenciaDetalheView` — `montarAgenciaDetalheViewSst` (caminho novo) e `montarAgenciaDetalheView` (caminho local, antigo)          |
| `src/modules/agencias-crm/types/agencia-detalhe.types.ts`                  | Contrato de dados do modal                                                                                                              |
| `src/modules/agencias-crm/infrastructure/agencia-sst-client.util.ts`       | Cliente SST compartilhado: cache (10min), retry, paginação com concorrência limitada                                                    |

---

## 6. Coisas pra ter em mente ao plugar o novo layout

- **`id` de linha ≠ id de banco.** Nas duas telas (listagem e modal), o "id" de uma agência do CRM é o **código SICA** (`String(codigo_empresa)`), não um cuid do Prisma. Se o novo front tiver rotas/links que assumem um id de banco (ex.: `/crm/agencias/[id]`), isso vai quebrar contra este backend.
- **CNPJ sem máscara na listagem, com máscara num dos endpoints do modal.** `AgenciaCarteiraView.cnpj` e `AgenciaDetalheView.dadosDocumentacao.empresa.cnpj` são dígitos puros; a chamada a `/api/agencias/cadastro` internamente aplica a máscara antes de mandar pro SST — isso é interno ao backend, o front não precisa se preocupar.
- **Sem paginação real no banco/API.** A carteira inteira (~21 mil agências) vem de uma vez e fica em memória no client. Se o novo layout mudar a UX de paginação, ainda assim todos os dados já estão no browser depois do primeiro load — só muda o que é renderizado.
- **Roster pode falhar silenciosamente** (ver 2.3) — o novo front pode querer expor um estado de erro/retry mais visível do que "lista vazia" pra esse caso.
- **Nem toda agência da listagem abre um modal "cheio".** Uma agência que existe no SST mas nunca passou pelo cadastro deste app sempre vai ter `socios: []`, dados de Receita `null`, `etapaLabel: null` etc. — isso é esperado, não é ausência de implementação.
- **`dadosFaltantes` e o filtro "Situação Receita"** existem no contrato mas não filtram nada de verdade hoje (ver 2.5) — se o novo layout não tiver mais esses controles, não há perda funcional real.
