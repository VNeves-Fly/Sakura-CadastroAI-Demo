# Plano: dados reais para o Fast View (`/crm/tv`)

> Documento autocontido — não depende do histórico da conversa que o gerou. Se você está lendo isso do zero, tem tudo que precisa pra implementar.

## 1. Problema

O front-end do Fast View já está pronto (pixel-perfect, reprodução de `fast-view2.html`) e funcionando 100% mock. Falta só a ligação com dado real — mesmo estágio em que o `dashboard-vendas` estava antes de ganhar `dashboard-vendas.sst-service.ts`.

Módulo: `src/modules/tv/`. Fluxo atual: `page.tsx` → `tvController.obterDados()` → `tvMockService.obterDados()` → `TvData` → `<TvView>`. Não existe `tv.sst-service.ts`, nem branch mock/real no controller, nem nenhum polling/refresh de dado de negócio (só o relógio do header, client-side, 1x/s).

Guard de acesso já existe e não muda: `page.tsx` linhas 12-18, só cargo `ADMIN` (mesmo do Dashboard CRM).

## 2. Achado-chave: a fonte é a mesma do Dashboard CRM

Os dois documentos de referência do usuário (`SPEC_TV.md`, `CRM.md` — de outro projeto/stack, Supabase+React) descrevem a **mesma regra de ouro** já implementada aqui: "todo valor de venda vem do consolidado SST oficial (`painel=FILIAL`, `situacao=ATIVOS`), nunca somar tabelas locais". E confirmam textualmente (`CRM.md` linha 27) que a Edge Function do overview é "a mesma fonte do BI **e da TV**" — ou seja, nos dois projetos, TV e Dashboard leem o mesmo dado.

Este projeto já tem essa integração real e testada em `src/modules/dashboard-vendas/services/dashboard-vendas.sst-service.ts`, contra o mesmo SST (`sst.flysakura.com`) que os dois documentos de referência também apontam (`SST_BASE_URL`). Isso muda o formato do trabalho: **não é escrever integração SST do zero**, é decidir como o Fast View vai consumir a que já existe.

### O que já existe e cobre quase tudo que o Fast View precisa

`dashboardVendasSstService.obterResumoEDia()` já devolve, com fallback automático pro mock em caso de erro (`comFallback`) e cache de 10 min (memória + Valkey opcional):

```ts
resumoPorPeriodo: {
  hoje: ResumoDia, ontem: ResumoDia, mes: ResumoDia, ano: ResumoDia
}
// ResumoDia = { aereo: CanalResumo, terrestre: CanalResumo, margemTotalPct: number }
// CanalResumo = { valor, quantidade, participacaoPct, margemPct, nacIntDetalhe: {nacional:{valor,bilhetes}, internacional:{valor,bilhetes}} }

rankingPorPeriodo: { hoje, ontem, mes, ano: TopAgencia[] }        // top agências (só aéreo)
fornecedoresPorPeriodo: { hoje, ontem, mes, ano: TopFornecedor[] } // ranking por companhia aérea
```

Isso já é literalmente `vendas`/`aereo`/`terrestre` do `TvData` (seção 3) — só falta reformatar o shape. `shareAereo` e `top10*` (seção 4) exigem decisão adicional.

## 3. Mapeamento direto (`vendas`, `aereo`, `terrestre`) — sem trabalho novo de integração

| Campo `TvData`                      | Fonte                                                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `vendas.hoje\|mes\|ano.valorTotal`  | `resumoPorPeriodo[periodo].aereo.valor + .terrestre.valor`                                                                         |
| `vendas.hoje\|mes\|ano.margemPct`   | `resumoPorPeriodo[periodo].margemTotalPct`                                                                                         |
| `aereo[periodo].valorTotal`         | `resumoPorPeriodo[periodo].aereo.valor`                                                                                            |
| `aereo[periodo].bilhetes`           | `resumoPorPeriodo[periodo].aereo.quantidade`                                                                                       |
| `aereo[periodo].agencias`           | não vem em `CanalResumo` hoje — precisa de `clientes` do overview bruto (já buscado, só não repassado nesse formato — ver seção 6) |
| `aereo[periodo].ticketMedio`        | `valorTotal / bilhetes` (calcular, `CanalResumo` não expõe `ticket_medio` hoje — mesmo caso de `agencias`)                         |
| `aereo[periodo].nacPct` / `intlPct` | derivar de `aereo.nacIntDetalhe`: `nacPct = nacional.valor / (nacional.valor + internacional.valor) * 100`                         |
| `terrestre[periodo].*`              | idêntico, trocando `aereo` por `terrestre`                                                                                         |

Único ponto real de atenção: `CanalResumo` (tipo já existente em `dashboard-vendas.types.ts`) não carrega `clientes`/`ticket_medio`, só `valor`/`quantidade`/`margemPct`/`nacIntDetalhe` — esses dois campos existem no overview bruto (`RawPeriodoOverview.clientes`/`.ticket_medio`) mas se perdem em `paraCanalResumo`. Duas opções, ambas pequenas:

- **A. Estender `CanalResumo`** com `clientes`/`ticketMedio` (mudança de tipo compartilhado, afeta Dashboard CRM também — precisa confirmar que não quebra nada lá).
- **B. `tv` busca o overview bruto direto** (reaproveitando só `sstGet`/`comCache`, não `paraResumoDia`) e monta seu próprio mapeamento — não toca em nada do `dashboard-vendas`.

Recomendo **B** — mais isolado, mesmo critério de "cada seção com seu próprio fallback" já usado no resto do projeto, sem risco de efeito colateral no Dashboard CRM.

## 4. Share Aéreo e Top 10 — confirmados ao vivo contra o SST (2026-08-24)

Os dois endpoints do `SPEC_TV.md` que este projeto nunca tinha chamado **existem e respondem 200** neste mesmo SST (`sst.flysakura.com`), com a `X-Internal-Secret` que já era usada para `AGENCY_ANALYSIS_API_KEY` (confirmado: os dois serviços flysakura aceitam o mesmo segredo — ver `.env`, `SST_API_KEY`). Nenhum dos dois blocos precisa mais de decisão em aberto.

### 4.1 Share Aéreo (`shareAereo`)

`GET /api/consolidado/vendas-por-companhia?startDate=YYYY-MM-DD&status=ATIVOS&painel=FILIAL` — testado ao vivo, resposta real:

```json
{
  "data": [
    {
      "categoria": "NACIONAL_AD",
      "tarifa": 462665.91,
      "rentabilidade": 17627.49,
      "margem": 3.81,
      "clientes": 46,
      "tickets": 379,
      "ticket_medio": 1220.75
    },
    {
      "categoria": "NACIONAL_G3",
      "tarifa": 293642.01,
      "rentabilidade": 16772.99,
      "margem": 5.71,
      "clientes": 71,
      "tickets": 204,
      "ticket_medio": 1439.42
    },
    {
      "categoria": "NACIONAL_JJ",
      "tarifa": 378974.26,
      "rentabilidade": 26916.03,
      "margem": 7.1,
      "clientes": 87,
      "tickets": 212,
      "ticket_medio": 1787.61
    },
    {
      "categoria": "NACIONAL_OUTRAS",
      "tarifa": 0,
      "rentabilidade": 4571.07,
      "margem": 0,
      "clientes": 1,
      "tickets": 1,
      "ticket_medio": 0
    },
    {
      "categoria": "INTERNACIONAL",
      "tarifa": 1606819.82,
      "rentabilidade": 48560.16,
      "margem": 3.02,
      "clientes": 100,
      "tickets": 223,
      "ticket_medio": 7205.47
    }
  ]
}
```

Mapeamento pra `CompanhiaShareTv[]` — descartar a linha `INTERNACIONAL` (Share Aéreo do Fast View é só nacional, mesmo critério do `SPEC_TV.md`), `pct = tarifa / soma(4 linhas NACIONAL_*) * 100`:

| `categoria`       | `nome` | `corHex` (já usado no mock atual)                                                       |
| ----------------- | ------ | --------------------------------------------------------------------------------------- |
| `NACIONAL_AD`     | Azul   | `#00A1E0`                                                                               |
| `NACIONAL_G3`     | Gol    | `#FF6600`                                                                               |
| `NACIONAL_JJ`     | Latam  | `#E91E8C`                                                                               |
| `NACIONAL_OUTRAS` | Outras | cor nova — mock atual não tem essa categoria; `#fbcfe8` é o valor usado no `SPEC_TV.md` |

`startDate` por período: `hoje` → hoje; `mes` → dia 1 do mês; `ano` → 1º de janeiro; `ontem` → ontem (o `SPEC_TV.md` não cobre "ontem" pra este bloco — mesma regra dos outros 3 períodos, por analogia).

### 4.2 Top 10 Clientes / Nacional / Internacional

`GET /api/consolidado/top-clientes?startDate=YYYY-MM-DD&limit=10&status=ATIVOS&painel=FILIAL` — testado ao vivo, resposta real com exatamente o shape do `SPEC_TV.md`:

```json
{
  "geral":         [{ "codigo": 50049, "nome": "TJT VIAGENS", "tarifa": 216145.89, "rentabilidade": 6794.18, "margem": 3.14, "clientes": 1, "tickets": 190, "ticket_medio": 1137.61 }, ...],
  "nacional":      [{ "codigo": 50049, "nome": "TJT VIAGENS", "tarifa": 214128.82, ... }, ...],
  "internacional": [{ "codigo": 41632, "nome": "PH VIAGENS E TURISMO LTDA", "tarifa": 87354.63, ... }, ...]
}
```

Mapeamento direto pra `Top10LinhaTv[]`: `posicao` = índice+1 (array já vem ordenado por `tarifa` desc), `nome`, `valor = tarifa`, `margemPct = margem`. `top10Clientes` ← `geral`, `top10Nacional` ← `nacional`, `top10Internacional` ← `internacional`. Sem gap nenhum — os 3 cards ficam 100% reais, margem incluída.

## 5. Refresh / atualização contínua

O `SPEC_TV.md` (seção 9) descreve 6 camadas redundantes (polling por query, Supabase Realtime, detecção de novo `finished_at`, `visibilitychange`, `setInterval` de 60s, Web Worker) — desenhado pra uma TV que fica dias ligada sem ninguém tocar, na stack Supabase (com Realtime nativo).

Este projeto não tem Realtime nem Web Worker equivalente hoje, e adicionar isso é desproporcional ao que o resto do admin usa. Proposta simplificada, cobrindo o mesmo objetivo (tela nunca fica com dado velho) com o que o projeto já tem:

1. **Client Component com `setInterval` de 30s** chamando uma nova API route (`GET /api/tv/dados`) que devolve o `TvData` fresco — troca de estado local, sem reload de página (mesmo princípio do relógio do header, só que buscando dado em vez de só formatar `Date`).
2. **`visibilitychange`** — refetch imediato ao a aba voltar a ficar visível (cobre o caso de standby de monitor).
3. Cache de 10 min do lado do servidor (reaproveitando `comCache`/Valkey, seção 3) evita que o polling de 30s martele o SST a cada tick — a maioria das chamadas do intervalo bate no cache, não no SST.

Isso cobre o objetivo real (TV sempre atualizada, sem martelar o SST) sem portar a arquitetura Supabase-specific inteira. Se no futuro quiser paridade total com o `SPEC_TV.md` (Web Worker pra sobreviver a aba em background, `visibilitychange` mais agressivo), é aditivo — não bloqueia esta primeira entrega.

O selo "sync ok" do `TvHeader` (hoje decorativo) passa a refletir se a última chamada ao endpoint real teve sucesso ou caiu no fallback mock — sem precisar de uma tabela de log de sincronização (não existe nada assim no schema hoje, e criar uma é desproporcional só pra colorir um selo).

## 6. Decisões a tomar antes de codar

Passo 0 do plano original (testar os 2 endpoints do `SPEC_TV.md` contra o SST real) **já foi feito e confirmado** — ver seção 4. Restam só decisões pequenas:

1. **Isolamento**: `tv` ganha seu próprio `tv.sst-service.ts` (4ª cópia de `sstGet`/`comCache`/`comFallback`, mesmo critério de bounded context isolado já usado em `agencias-crm`/`dashboard-vendas`/`atribuicoes`) — recomendado, evita qualquer risco de efeito colateral nos outros dois módulos.
2. **Refresh**: confirmar os 30s + `visibilitychange` da seção 5, ou pedir algo mais/menos agressivo.
3. **`SST_API_KEY` agora está configurada** (`.env`, mesmo segredo de `AGENCY_ANALYSIS_API_KEY`, confirmado ao vivo 2026-08-24) — isso significa que `/crm/agencias` deixa de usar o fallback local (agências reais do funil de cadastro, implementado hoje mais cedo) e passa a mostrar a carteira comercial real do SST. Efeito esperado, não é bug — mas vale revisar essa tela depois de configurar a chave em qualquer outro ambiente.

## 7. Arquivos

### Novos

- `src/modules/tv/services/tv.sst-service.ts` — `sstGet`/`comCache`/`comFallback` (padrão já usado 3x no projeto) + as chamadas mapeadas na seção 3, e o que o passo 0 confirmar pra seção 4.
- `src/app/api/tv/dados/route.ts` — API route que o polling do client chama (`GET`, mesmo guard de cargo `ADMIN` do `page.tsx`).

### Modificados

- `src/modules/tv/presentation/controllers/tv.controller.ts` — branch mock/real por `SST_API_KEY` (mesmo padrão de `dashboard-vendas.controller.ts`).
- `src/modules/tv/components/tv-view.tsx` — vira Client Component com polling (`setInterval` 30s + `visibilitychange`), substitui o dado inicial recebido do server por refetches subsequentes via `/api/tv/dados`.
- `src/modules/tv/components/tv-header.tsx` — selo "sync ok"/"sync falha" reativo ao resultado do último fetch (prop nova, em vez de fixo).

### Referência — não altera, só empresta o padrão

- `src/modules/dashboard-vendas/services/dashboard-vendas.sst-service.ts` (modelo de `sstGet`/`comCache`/`comFallback`, e overview já confirmado real)
- `src/modules/dashboard-vendas/infrastructure/valkey-cache.util.ts`
- `src/modules/cadastro/infrastructure/adapters/flysakura-sst-http.util.ts` (`sstBaseUrl()`/`requireSstApiKey()`)

## 8. Ordem sugerida de implementação

1. `tv.sst-service.ts` com os blocos de `vendas`/`aereo`/`terrestre` (seção 3, via overview) — validar contra o overview real, comparando com o que já aparece no Dashboard CRM pro mesmo dia (deve bater).
2. `shareAereo` (`/api/consolidado/vendas-por-companhia`) e `top10*` (`/api/consolidado/top-clientes`) no mesmo `tv.sst-service.ts` — shapes já confirmados na seção 4, sem incerteza.
3. Branch mock/real em `tv.controller.ts`.
4. `/api/tv/dados` + polling em `tv-view.tsx` + selo reativo em `tv-header.tsx`.

## 9. Verificação (checklist pra rodar depois de implementar)

1. Comparar "Vendas Hoje/Mês/Ano" do Fast View com o mesmo dia no Dashboard CRM (`/crm/dashboard`) — precisam bater exatamente (mesma fonte).
2. Trocar o filtro de período (Hoje/Ontem/Mês/Ano) e confirmar que todos os cards (Aéreo, Terrestre, Share, Top 10×3) mudam juntos.
3. Desligar `SST_API_KEY` num ambiente de teste → página deve cair pro mock sem quebrar (mesmo comportamento do Dashboard CRM).
4. Deixar a aba aberta >30s → conferir no Network que o polling dispara e os números atualizam sem reload de página.
5. Minimizar/restaurar a aba → conferir que o `visibilitychange` dispara um refetch imediato.
