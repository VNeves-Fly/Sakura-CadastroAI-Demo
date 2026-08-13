# Backend necessário para o Dashboard de Vendas (`/dashboard-new`)

Levantamento do que o backend precisa entregar pra substituir o mock de `src/modules/dashboard-vendas/` por dados reais, sem quebrar o contrato que o front já consome. **Front-end 100% pronto e verificado ao vivo** (login real + screenshot, ver conversa) — nada aqui bloqueia o front; é o backend que falta nascer.

> Front-end de referência: `src/modules/dashboard-vendas/types/dashboard-vendas.types.ts` (contrato de dados), `services/dashboard-vendas.mock-service.ts` (todo número que precisa virar real), `adapters/dashboard-vendas.adapter.ts` (o que já é calculado no front e **não** precisa vir pronto do backend).

---

## 1. Achado principal — este domínio não existe hoje

O schema atual (`prisma/schema.prisma`) é 100% sobre **onboarding de agências** (`Agencia`, `Contrato`, `CadastroComplementar`, `User`, `Promotor`, `Gestor`, `Base`, `Associacao`...). **Não existe nenhuma tabela de venda/bilhete/transação.** O Dashboard descrito na spec é sobre um domínio totalmente diferente: **vendas de bilhetes aéreos e produtos terrestres** feitas pelas agências — isso é operação de emissão/back-office, não cadastro.

Duas armadilhas pra não confundir antes de desenhar schema:

- **`enum TipoVenda` (`NACIONAL`/`INTERNACIONAL`/`TERRESTRE`) e `model VendaPercentual`** já existem no schema (`prisma/schema.prisma:156` e `:418`), mas são só o **percentual autodeclarado pela agência no cadastro** ("X% da sua venda é nacional/internacional/terrestre") — um campo de formulário, não uma venda real. Não são a fonte de dado desta página, mesmo com o nome parecido.
- **`Agencia.id` é o ponto de integração correto** — toda venda real deve referenciar `agenciaId → Agencia.id`, reaproveitando a identidade que já existe (nome, CNPJ, executivo, associação), em vez de duplicar cadastro de agência num sistema novo.

### Pergunta que precisa de resposta antes de desenhar qualquer schema

**De onde vêm os dados de venda de bilhete?** Provavelmente de um sistema de emissão/GDS/ERP financeiro da Sakura, separado deste app de cadastro. Isso muda tudo:

| Cenário                                                                                                                                                     | O que o backend precisa construir                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **(A) Sistema externo já registra as vendas** (mais provável, dado o nome "CRM-sakura" e o fato de cadastro/onboarding e emissão serem operações distintas) | Um **adapter de sincronização** (mesmo padrão de `docs/d4sign.md`/`docs/receitaws.md`/`docs/flysakura.md` — `Mock*Service` + serviço real gated por env var) que importa/recebe as vendas e materializa em tabelas de leitura própria deste app. |
| **(B) Ninguém registra isso ainda**                                                                                                                         | É um produto novo do zero (captura de venda), escopo muito maior que "montar um dashboard" — precisa alinhamento de produto antes de qualquer linha de código.                                                                                   |

Sem essa resposta, qualquer schema abaixo é best-effort. O desenho a seguir assume **(A)**, mas serve igual pra (B) — a diferença é só quem escreve nas tabelas (um job de sync vs. uma tela/API de lançamento).

---

## 2. Contrato de dados — o que o backend precisa devolver

O front já está desacoplado por camada (`service` → `adapter` → `controller` → `page.tsx`, ver `src/modules/dashboard-vendas/`). Pra trocar o mock pelo real, só o **service** (`dashboard-vendas.mock-service.ts` → um `dashboard-vendas.service.ts` que chama a API real) muda — adapter, controller, componentes e página continuam iguais. Ou seja: **o backend só precisa devolver o shape abaixo**, e o front pluga sem nenhuma alteração visual.

Shape completo (já implementado no front, ver `dashboard-vendas.types.ts`):

```ts
type DashboardVendasData = {
  resumoPorPeriodo: Record<"hoje" | "ontem" | "mes" | "ano", ResumoDia>;
  miniKpis: MiniKpis;
  intraday: BucketIntraday[];
  projecao: ProjecaoDia;
  acuracia: AcuraciaProjecao;
  recencia: RecenciaAgencias;
  conversao: Record<"ambos" | "aereo" | "terrestre", ConversaoCanal>;
  vendasMensais: VendaMensal[];
  vendasDiarias: VendaDiaria[];
  rankingPorMes: Record<"mes" | "ano", TopAgencia[]>;
  fornecedoresPorMes: Record<"mes" | "ano", TopFornecedor[]>;
  nacionalInternacionalPorMes: Record<"mes" | "ano", NacionalInternacional>;
  cruzamentoCanais: CruzamentoCanais;
};
```

**Importante — o que o backend NÃO precisa calcular** (o `adapter` do front já faz):

- `participacaoPct` de `ResumoDia.aereo`/`.terrestre` — derivado de `valor` dos dois lados.
- `pct` de cada grupo de `CruzamentoCanais` — derivado de `qtd / totalAgenciasCarteira`.

Tudo o resto (inclusive `margemPct`, que depende de custo/comissão e **não é derivável de `valor`**) precisa vir pronto do backend.

Sugestão de endpoint único (mesma filosofia do resto do app, que usa Server Component chamando um controller direto, sem round-trip HTTP client-side): `GET /api/dashboard-vendas` retornando o shape acima completo, ou um `DashboardVendasController.obterDashboard()` chamado direto do `page.tsx` caso os dados fiquem no mesmo banco/processo. **Não** fatiar em 10 endpoints por seção — a página carrega tudo de uma vez hoje (`Promise.all` nem existe porque é uma chamada só), fatiar sem necessidade real só adiciona latência.

---

## 3. Modelagem de dados proposta (rascunho — nenhuma migration aplicada)

Assumindo cenário (A) da seção 1. **Isto é uma proposta pra discussão, não algo pra rodar** — este projeto tem a regra explícita de não aplicar migration nova sem aprovação (ver `project_architecture_principles`); qualquer schema aqui precisa ser revisado por quem conhece o sistema de origem antes de virar `schema.prisma` de verdade.

```prisma
// Uma linha por bilhete/venda individual — granularidade mínima pra
// sustentar TODAS as seções (intraday por bucket de 15min só existe se a
// origem for transacional, não pré-agregada por dia).
model Venda {
  id             String    @id @default(cuid())
  agenciaId      String
  agencia        Agencia   @relation(fields: [agenciaId], references: [id])
  canal          CanalVenda   // AEREO | TERRESTRE
  tipoAereo      TipoAereo?   // NACIONAL | INTERNACIONAL — null quando canal = TERRESTRE
  fornecedorId   String?      // cia aérea (canal aéreo) — null em terrestre, ou obrigatório conforme regra de produto
  fornecedor     Fornecedor?  @relation(fields: [fornecedorId], references: [id])
  valorBruto     Decimal   @db.Decimal(14, 2)
  valorCusto     Decimal?  @db.Decimal(14, 2)   // pra calcular margemPct — de onde vem?
  quantidade     Int       @default(1)          // bilhetes (aéreo) ou "vendas" (terrestre) — geralmente 1
  emitidoEm      DateTime                        // timestamp real da emissão, não só a data — intraday depende disso
  origemExternaId String?  @unique               // id no sistema de origem, pra sync idempotente

  @@index([agenciaId, emitidoEm])
  @@index([emitidoEm, canal])
  @@map("vendas")
}

enum CanalVenda {
  AEREO
  TERRESTRE
}

enum TipoAereo {
  NACIONAL
  INTERNACIONAL
}

model Fornecedor {
  id     String @id @default(cuid())
  nome   String @unique // "LATAM", "AZUL"...
  vendas Venda[]
  @@map("fornecedores")
}

// Snapshot diário da projeção — necessário pra alimentar "Acurácia da
// projeção" (4.5), que compara previsto x real. Sem persistir o previsto
// NO MOMENTO em que foi calculado, não tem como medir erro depois (o
// "previsto" de hoje não pode ser recalculado com dados de amanhã).
model ProjecaoDiariaSnapshot {
  id                 String   @id @default(cuid())
  dia                DateTime @unique @db.Date
  fechamentoEsperado Decimal  @db.Decimal(14, 2)
  faixaMin           Decimal  @db.Decimal(14, 2)
  faixaMax           Decimal  @db.Decimal(14, 2)
  geradoEm           DateTime @default(now())
  realizadoFinal     Decimal? @db.Decimal(14, 2) // preenchido pelo job de fechamento do dia (ver seção 5.5)
  @@map("projecoes_diarias_snapshot")
}
```

Campos marcados com "de onde vem?" são exatamente os pontos que precisam de decisão de produto (seção 4).

---

## 4. Decisões de negócio que faltam (bloqueiam a implementação, não a modelagem)

Sinalizando cada uma em vez de inventar um número — nenhuma foi confirmada:

1. **Margem (`margemPct`)** — depende de custo/comissão por venda. Vem de onde? Tarifa líquida vs bruta do fornecedor? Comissão da agência? Sem essa definição, `ResumoDia.aereo.margemPct`/`.terrestre.margemPct` (4.1) não têm como ser calculados.
2. **"Saúde" (`saudePct`, 4.7)** — a spec não define a fórmula, só mostra o resultado (`32,9%`). Precisa de uma definição de produto (ex.: combinação ponderada de crescimento de volume + agências ativas + ticket médio?) antes de codar.
3. **Algoritmo de projeção (4.4)** — "histórico do dia da semana" sugere: pegar as últimas N ocorrências do mesmo dia da semana, calcular média/desvio até a hora atual, extrapolar. **N (quantas semanas pra trás) e o método de extrapolação não estão definidos.** Isso é uma decisão de estatística/produto, não só engenharia.
4. **Faixa de confiança (`faixaMin`/`faixaMax`, 4.4)** — depende diretamente do método acima (ex.: ±1 desvio padrão do histórico? percentil 10/90?).
5. **"Carteira" no Cruzamento (4.11)** — `totalAgenciasCarteira` é o denominador de todos os percentuais. É `Agencia.status = ativo`? Todas não-recusadas? Todas com contrato assinado? A spec mostra `16.598` sem explicar o filtro.
6. **Janela "Mês" nos seletores Mês/Ano (4.7, 4.10)** — "mês" é o mês calendário atual, os últimos 30 dias corridos, ou o mês corrente até a data de hoje (parcial)? Afeta a query e a comparação MoM.
7. **Threshold de "sem vendas" (4.6)** — as faixas 31-89D/90-179D/+180D partem de quê: última venda em qualquer canal, ou por canal? Confirma contra `Agencia.createdAt` pra agências que nunca venderam (nunca tiveram "última venda")?
8. **Rota nacional x internacional (4.3, 4.10)** — precisa de uma regra de classificação por trecho/destino (provavelmente já existe no sistema de origem, mas precisa ser confirmada, não assumida).

---

## 5. Requisitos por seção (mapa completo, nenhuma seção pulada)

| Seção              | Precisa de                                                                                             | Observação                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 Resumo do dia  | Agregação `Venda` por período × canal (valor, quantidade) + margem (decisão #1)                        | 4 períodos (hoje/ontem/mês/ano) — 4 queries ou 1 query parametrizada                                                                           |
| 4.2 Mini KPIs      | `COUNT(DISTINCT agenciaId)`, `COUNT`/`SUM` de `Venda` (canal=AEREO, hoje)                              | Ticket médio = valor/qtd, sem cálculo extra                                                                                                    |
| 4.3 Intraday       | `Venda.emitidoEm` com granularidade de **minuto**, agrupado em buckets de 15min, canal×tipoAereo       | **Exige timestamp real de emissão**, não basta ter só a data — se a origem só manda "dia", esta seção não é implementável como está            |
| 4.4 Projeção       | Decisões #3 e #4 + histórico de `Venda` por dia da semana                                              | Maior risco de escopo da página — é estatística, não CRUD                                                                                      |
| 4.5 Acurácia       | `ProjecaoDiariaSnapshot` (seção 3) + **job diário** que fecha `realizadoFinal` no fim do dia           | Precisa de scheduler — não existe nenhum no projeto hoje (confirmado: sem cron/`node-cron`/Cloud Scheduler em uso), decisão de infra em aberto |
| 4.6 Recência       | Última venda por agência × canal, com corte por ano civil                                              | Decisão #7                                                                                                                                     |
| 4.7 Conversão      | Comparação MoM (`Venda` agrupado por mês, 2 janelas) + decisão #2                                      | "Comparando 1–12 jul vs 1–12 ago" sugere janela de dias fixos, não mês inteiro — confirmar decisão #6                                          |
| 4.8 Vendas mensais | `SUM(Venda.valorBruto)` por mês × canal×tipoAereo, ano corrente                                        | Direto, sem decisão pendente                                                                                                                   |
| 4.9 Vendas diárias | Mesma agregação, por dia, últimos 30 dias                                                              | Direto                                                                                                                                         |
| 4.10 Rankings      | Top 10 `Agencia` por `SUM(valorBruto)` (mês/ano); Top 10 `Fornecedor`; Nacional×Internacional agregado | Corretamente já linkável a `Agencia.id` existente                                                                                              |
| 4.11 Cruzamento    | `Venda` distinto por `agenciaId`×canal nos últimos 365 dias, contra decisão #5                         | —                                                                                                                                              |

---

## 6. Requisitos não-funcionais

- **Timezone**: todo cálculo de "hoje"/"dia da semana"/buckets precisa ser em `America/Sao_Paulo` (mesmo padrão já usado em `src/app/(admin)/cadastros/exportar/route.ts:13`), nunca UTC cru — senão o corte de "meia-noite" e os buckets de 15min ficam errados pra quem opera no horário de Brasília.
- **Performance do intraday (4.3)**: é a seção mais sensível a "tempo real" (a spec fala em atualização contínua). Se `Venda` crescer muito, agregar direto na tabela transacional a cada request pode ficar lento — considerar uma tabela pré-agregada por bucket (populada por trigger/job) desde o início, em vez de otimizar depois.
- **Idempotência do sync**: se a origem for um sistema externo (cenário A da seção 1), toda importação precisa de uma chave natural (`origemExternaId`, já no rascunho de schema) pra rodar o sync múltiplas vezes sem duplicar venda.
- **Moeda/precisão**: usar `Decimal` no Postgres (nunca `Float`) pra valores monetários — já é o padrão do restante do schema (`@db.Decimal`), só reforçando pra quem for desenhar `Venda`.
- **Consistência com `Agencia` existente**: `agenciaId` deve ser o `cuid` real de `Agencia.id` — nunca reintroduzir um cadastro de agência paralelo só porque a fonte de vendas é outro sistema (usar CNPJ como chave de link no sync, já que `Agencia.cnpj` é `@unique`).

---

## 7. O que fica fora deste documento

- Qualquer definição de UI/UX — já implementada e validada (ver conversa/screenshots).
- Qual sistema externo é a fonte real de vendas — depende de resposta do time de produto/operação (seção 1), não é uma decisão técnica deste app.
- Implementação em si (schema, use-cases, jobs) — propositalmente não iniciada aqui, por ser trabalho de backend fora do escopo atual desta sessão (front-end only).

## 8. Checklist pra destravar a implementação

- [ ] Confirmar a fonte real dos dados de venda (seção 1).
- [ ] Resolver as 8 decisões de negócio da seção 4 (pelo menos as #1, #3, #4, #5 — bloqueiam seções inteiras).
- [ ] Validar o rascunho de schema da seção 3 com quem conhece o sistema de origem.
- [ ] Decidir infra de job agendado pra 4.5 (seção 6) — nenhuma existe hoje no projeto.
- [ ] Implementar o sync/endpoint retornando exatamente o shape da seção 2 — o front pluga sem alteração.
