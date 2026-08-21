# Plano: dashboard do Gestor com dados reais agregados (soma dos executivos)

> Documento autocontido — não depende do histórico da conversa que o gerou. Se você está lendo isso do zero, tem tudo que precisa pra implementar.

## 1. Problema e decisão de produto

Hoje as 3 abas do detalhe do Gestor (`/crm/gestores/[id]`, `/executivos`, `/agencias`) mostram métricas de vendas **100% mock**, geradas deterministicamente via `hashParaNumero(gestor.id)` (mesmo id sempre gera os mesmos números fake, pra não "piscar" a cada reload).

A tela irmã do Executivo (`/crm/executivos/[id]` e suas abas) já é **real**: quando o `Promotor` (= executivo) tem um código `sica` vinculado e a env var `SST_API_KEY` está configurada, os números vêm de um sistema externo chamado SST (Sica/Sigot). Sem isso, cai num mock determinístico equivalente, por executivo.

**Pedido**: fazer a tela do Gestor "parecida com a de executivos", mas os números do gestor devem ser **a soma agregada dos números reais de todos os executivos subordinados a ele** (relação `Promotor.gestorId → Gestor.id`).

### Decisões já fechadas com o usuário (não reabrir sem confirmar de novo)

1. **Não existe uma parcela "própria" do gestor, separada da soma dos executivos.** Confirmado no schema (`prisma/schema.prisma`): `Gestor` não tem campo `sica`, e `Agencia` só se liga a `Gestor` indiretamente via `Agencia.executivoId → Promotor.gestorId` (não existe `Agencia.gestorId` nem qualquer FK direta). Ou seja, o Gestor não tem carteira própria nem identidade no SST — a soma agregada dos subordinados **é** o número dele. Não inventar uma parcela mock adicional "pessoal" do gestor.
2. **Escopo cobre as 3 abas**: Dashboard, Executivos e Agências — não só a tela principal.

### Insight de arquitetura que simplifica tudo

`executivoDashboardController.obterHeroKpis()` e `obterCrossCanalEMiniStats()` (em `src/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller.ts`) **já decidem mock-vs-real por executivo individualmente**, baseado no `sica` daquele executivo específico:

```ts
function usaSstReal(sica: number | null): sica is number {
  return sica != null && Boolean(process.env.SST_API_KEY);
}
```

Isso significa que a agregação do Gestor **não precisa de nenhum gate próprio de mock/real**. Basta chamar essas funções para cada subordinado — cada uma cai em real ou mock por conta própria — e somar os resultados:

- Gestor com todos os subordinados tendo SICA → agregado 100% real.
- Gestor com subordinados mistos → agregado misto, plausível, sem código especial.
- Gestor sem nenhum subordinado com SICA → agregado 100% mock (cada subordinado cai no próprio fallback mock determinístico), sem quebrar nada.

Isso elimina a necessidade de qualquer lógica nova de "decisão mock vs real no nível do gestor".

## 2. O que já é real hoje vs. o que vira real com esta mudança

Fonte real única para tudo isso: `executivoDashboardController` (módulo `atribuicoes`, **não será alterado** por este plano — só reaproveitado).

### Contrato do Executivo (referência, já existe e funciona)

```ts
// src/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller.ts
executivoDashboardController.obterHeroKpis(
  sica: number | null,
  promotorId: string,
  totalAgencias: number,
  agencias: ExecutivoAgenciaResumo[],
): Promise<{ hero: ExecutivoDashboard["hero"]; kpis: KpisSecundarios }>

executivoDashboardController.obterCrossCanalEMiniStats(
  sica: number | null,
  promotorId: string,
  totalAgencias: number,
  agencias: ExecutivoAgenciaResumo[],
): Promise<{
  crossCanal: ExecutivoDashboard["crossCanal"];
  miniStats: MiniStats;
  saudeCarteira: SegmentoSaude[];
  agenciasCarteira: AgenciaCarteiraResumo[];
}>
```

Tipos exatos (`src/modules/atribuicoes/types/executivo-detalhe.types.ts`):

```ts
type PeriodoVendasMesHero = "dia" | "ontem" | "mes" | "ano";

interface VendasMesHero {
  valor: number;
  bilhetes: number;
  agenciasVendendo: number;
  variacaoPct: number; // variação vs. período anterior equivalente
}

interface KpisSecundarios {
  mesAnteriorValor: number;
  mesAnteriorFaltaValor: number;
  mesAnteriorPercentualAtingido: number;
  projecaoFimMes: number;
  acumuladoAnoValor: number;
  acumuladoAnoBilhetes: number;
  ticketMedio30d: number;
}

interface MiniStats {
  agencias: number;
  vendendo30d: number;
  vendendo30dPct: number;
  ociosasLimite: number; // NUNCA vem do SST, sempre mock (mesmo no Executivo real)
  comCredito: number; // idem
}

interface AgenciaSegmentoResumo {
  nome: string;
  cnpj: string;
  valor: number;
}

interface SegmentoComLista {
  quantidade: number;
  pct: number;
  agencias: AgenciaSegmentoResumo[];
}

interface CrossCanal {
  ativasUltimos12m: number;
  aprovadas: number; // = totalAgencias
  volAereo: number;
  volTerrestre: number;
  soAereo: SegmentoComLista;
  soTerrestre: SegmentoComLista;
  ambos: SegmentoComLista;
}

interface SegmentoSaude {
  chave: "ativas" | "potenciais" | "ociosas" | "inativas";
  label: string;
  descricao: string;
  quantidade: number;
  pct: number;
  agencias: AgenciaSegmentoResumo[];
}

interface AgenciaCarteiraResumo {
  codigo: number;
  nome: string;
  cnpj: string;
  status: string; // empresa_status do SST
  canal: "aereo" | "terrestre" | "ambos" | "nenhum";
  faixaRecencia: "ate30d" | "30a90d" | "90a365d" | "semVenda365d";
  vendasAno: number;
  bilhetesAno: number;
  vendas90d: number;
  bilhetes90d: number;
  vendas30d: number;
  bilhetes30d: number;
}
```

**Confirmado por leitura direta de `executivo-dashboard.sst-service.ts`** (`construirSaudeCarteira`, linhas ~421-482): a classificação ativas/potenciais/ociosas/inativas (e também `faixaRecencia` e os segmentos de `crossCanal`) é feita por **regra absoluta por agência** (presença/ausência de venda em janelas de tempo fixas — 30d/365d), **nunca relativa/percentil ao roster daquele executivo**. Isso é o que torna a agregação (somar quantidades + concatenar listas de agências) matematicamente válida — não é preciso recalcular a classificação do zero sobre o roster consolidado.

Limitação conhecida (já existe hoje, não é introduzida por este plano): `MiniStats.ociosasLimite`/`comCredito` nunca vêm do SST real, mesmo quando o resto é real — permanecem mock mesmo depois da agregação.

## 3. Camada nova: agregação no módulo `gestores`

### 3.1 `src/modules/gestores/utils/agregacoes-gestor.util.ts` (novo — funções puras, sem I/O)

```ts
// Soma um período do hero (dia/ontem/mes/ano) de N executivos.
function somarPeriodoHero(periodos: VendasMesHero[]): VendasMesHero {
  let somaValor = 0,
    somaBilhetes = 0,
    somaAgenciasVendendo = 0,
    somaValorAnterior = 0;
  for (const p of periodos) {
    somaValor += p.valor;
    somaBilhetes += p.bilhetes;
    somaAgenciasVendendo += p.agenciasVendendo; // seguro: cada agência pertence a 1 único executivo
    const fator = 1 + p.variacaoPct / 100;
    // reconstrói o valor do período anterior a partir de valor_i e variacaoPct_i:
    // variacaoPct_i = (valor_i - anterior_i) / anterior_i * 100  =>  anterior_i = valor_i / (1 + variacaoPct_i/100)
    const anterior = fator > 0 ? p.valor / fator : p.valor; // guarda: variacaoPct <= -100% -> assume variação zero
    somaValorAnterior += anterior;
  }
  const variacaoPct =
    somaValorAnterior > 0 ? ((somaValor - somaValorAnterior) / somaValorAnterior) * 100 : 0; // guarda: soma de anteriores zero -> 0%, nunca Infinity/NaN
  return {
    valor: somaValor,
    bilhetes: somaBilhetes,
    agenciasVendendo: somaAgenciasVendendo,
    variacaoPct,
  };
}

function somarHeroTodosPeriodos(heroList: Record<PeriodoVendasMesHero, VendasMesHero>[]) {
  const periodos: PeriodoVendasMesHero[] = ["dia", "ontem", "mes", "ano"];
  return Object.fromEntries(
    periodos.map((periodo) => [periodo, somarPeriodoHero(heroList.map((h) => h[periodo]))]),
  ) as Record<PeriodoVendasMesHero, VendasMesHero>;
}

// mesAtualValorAgregado = somarHeroTodosPeriodos(...).mes.valor (já calculado antes)
function somarKpis(kpisList: KpisSecundarios[], mesAtualValorAgregado: number) {
  const mesAnteriorValor = kpisList.reduce((s, k) => s + k.mesAnteriorValor, 0);
  const projecaoFimMes = kpisList.reduce((s, k) => s + k.projecaoFimMes, 0);
  const vendendo30d = kpisList.reduce((s, k) => s + k.vendendo30d, 0); // se existir no tipo Gestor
  return {
    mesAnteriorValor,
    mesAnteriorFaltaValor: Math.max(0, mesAnteriorValor - mesAtualValorAgregado),
    // razão dos TOTAIS agregados, nunca média das razões individuais — um executivo
    // pequeno com 200% de atingimento não pode distorcer a média como distorceria
    // uma média simples de percentuais.
    mesAnteriorPercentualAtingido:
      mesAnteriorValor > 0 ? Math.round((mesAtualValorAgregado / mesAnteriorValor) * 100) : 0,
    projecaoFimMes,
  };
  // Nota: ticketMedio30d/acumuladoAnoValor/acumuladoAnoBilhetes do KpisSecundarios do
  // Executivo NÃO são necessários aqui — o tipo KpisSecundariosGestor (Gestor) já não
  // inclui esses campos hoje. Não reconstruir.
}

function dedupPorCnpj<T extends { cnpj: string }>(itens: T[]): T[] {
  const vistos = new Set<string>();
  return itens.filter((item) => {
    const chave = unmaskCnpj(item.cnpj);
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

function somarSegmentoComLista(
  segmentos: SegmentoComLista[],
  totalConsolidado: number,
): SegmentoComLista {
  const agencias = dedupPorCnpj(segmentos.flatMap((s) => s.agencias)); // dedup = salvaguarda defensiva
  const quantidade = agencias.length;
  return {
    quantidade,
    pct: totalConsolidado > 0 ? Math.round((quantidade / totalConsolidado) * 1000) / 10 : 0,
    agencias,
  };
}

function somarCrossCanal(list: CrossCanal[]): CrossCanal {
  const ativasUltimos12m = list.reduce((s, c) => s + c.ativasUltimos12m, 0);
  const aprovadas = list.reduce((s, c) => s + c.aprovadas, 0);
  const volAereo = list.reduce((s, c) => s + c.volAereo, 0);
  const volTerrestre = list.reduce((s, c) => s + c.volTerrestre, 0);
  return {
    ativasUltimos12m,
    aprovadas,
    volAereo,
    volTerrestre,
    soAereo: somarSegmentoComLista(
      list.map((c) => c.soAereo),
      ativasUltimos12m,
    ),
    soTerrestre: somarSegmentoComLista(
      list.map((c) => c.soTerrestre),
      ativasUltimos12m,
    ),
    ambos: somarSegmentoComLista(
      list.map((c) => c.ambos),
      ativasUltimos12m,
    ),
  };
}

// Confirmado: classificação ativas/potenciais/ociosas/inativas é por regra ABSOLUTA
// por agência (não relativa ao roster do executivo) — ver executivo-dashboard.sst-service.ts,
// construirSaudeCarteira(). Por isso é seguro somar quantidade + concatenar listas por chave.
function somarSaudeCarteira(list: SegmentoSaude[][]): SegmentoSaude[] {
  const chaves = ["ativas", "potenciais", "ociosas", "inativas"] as const;
  const totalConsolidado = list.reduce(
    (s, segs) => s + segs.reduce((s2, seg) => s2 + seg.quantidade, 0),
    0,
  );
  return chaves.map((chave) => {
    const segmentosDaChave = list
      .map((segs) => segs.find((s) => s.chave === chave))
      .filter(Boolean) as SegmentoSaude[];
    const agencias = dedupPorCnpj(segmentosDaChave.flatMap((s) => s.agencias));
    return {
      chave,
      label: segmentosDaChave[0]?.label ?? "",
      descricao: segmentosDaChave[0]?.descricao ?? "",
      quantidade: agencias.length,
      pct: totalConsolidado > 0 ? Math.round((agencias.length / totalConsolidado) * 1000) / 10 : 0,
      agencias,
    };
  });
}
```

### 3.2 `src/modules/gestores/presentation/controllers/gestor-dashboard.controller.ts` (novo — orquestração)

Reaproveita `executivoDashboardController` (módulo `atribuicoes`, sem alterar) e `mapAgencia` (já exportado em `src/modules/atribuicoes/adapters/executivo-detalhe.adapter.ts`) pra converter `AgenciaResumoPromotor[]` (formato local, vindo do loader do Gestor) em `ExecutivoAgenciaResumo[]` (formato esperado pelo controller do Executivo).

```ts
import { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";
import { mapAgencia } from "@/modules/atribuicoes/adapters/executivo-detalhe.adapter";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import {
  somarHeroTodosPeriodos,
  somarKpis,
  somarCrossCanal,
  somarSaudeCarteira,
} from "@/modules/gestores/utils/agregacoes-gestor.util";

function isFulfilled<T>(r: PromiseSettledResult<T>): r is PromiseFulfilledResult<T> {
  return r.status === "fulfilled";
}

export const gestorDashboardController = {
  async obterHeroKpisAgregado(executivos: ExecutivoComCarteira[]) {
    const porExecutivo = (
      await Promise.allSettled(
        executivos.map(async (e) => ({
          id: e.id,
          ...(await executivoDashboardController.obterHeroKpis(
            e.sica,
            e.id,
            e.agencias.length,
            e.agencias.map(mapAgencia),
          )),
        })),
      )
    )
      .filter(isFulfilled)
      .map((r) => r.value);
    // Promise.allSettled: 1 executivo com SST fora do ar não derruba o agregado inteiro.

    const hero = somarHeroTodosPeriodos(porExecutivo.map((p) => p.hero));
    const kpis = somarKpis(
      porExecutivo.map((p) => p.kpis),
      hero.mes.valor,
    );
    return { hero, kpis, porExecutivo };
  },

  async obterCrossCanalAgregado(executivos: ExecutivoComCarteira[]) {
    const porExecutivo = (
      await Promise.allSettled(
        executivos.map(async (e) => ({
          id: e.id,
          ...(await executivoDashboardController.obterCrossCanalEMiniStats(
            e.sica,
            e.id,
            e.agencias.length,
            e.agencias.map(mapAgencia),
          )),
        })),
      )
    )
      .filter(isFulfilled)
      .map((r) => r.value);

    const crossCanal = somarCrossCanal(porExecutivo.map((p) => p.crossCanal));
    const saudeCarteira = somarSaudeCarteira(porExecutivo.map((p) => p.saudeCarteira));
    const agenciasCarteira = porExecutivo.flatMap((p) => p.agenciasCarteira);
    const totalAgencias = porExecutivo.reduce((s, p) => s + p.miniStats.agencias, 0);
    const vendendo30d = porExecutivo.reduce((s, p) => s + p.miniStats.vendendo30d, 0);
    const miniStats = {
      agencias: totalAgencias,
      vendendo30d,
      vendendo30dPct: totalAgencias > 0 ? Math.round((vendendo30d / totalAgencias) * 100) : 0,
      // ociosasLimite/comCredito: nunca reais mesmo no Executivo — soma dos valores mock individuais.
      ociosasLimite: porExecutivo.reduce((s, p) => s + p.miniStats.ociosasLimite, 0),
      comCredito: porExecutivo.reduce((s, p) => s + p.miniStats.comCredito, 0),
    };
    return { crossCanal, saudeCarteira, agenciasCarteira, miniStats, porExecutivo };
  },

  // Helper de conveniência pras abas Executivos/Agências — tabelas renderizam tudo de
  // uma vez, sem ganho de Suspense parcial (diferente do Dashboard).
  async obterAgregadoCompleto(executivos: ExecutivoComCarteira[]) {
    const heroKpis = await gestorDashboardController.obterHeroKpisAgregado(executivos);
    const crossCanal = await gestorDashboardController.obterCrossCanalAgregado(executivos);
    return { ...heroKpis, ...crossCanal };
  },
};
```

## 4. Aba Dashboard (`/crm/gestores/[id]`)

Replicar o streaming em 2 fases que já existe no Executivo (`executivo-dashboard-view.tsx`), na escala de N executivos:

1. `gestor-dashboard-view.tsx` deixa de ter `"use client"` no topo e vira Server Component que **cria as promises sem `await`**:
   ```ts
   function depoisDe<T>(gate: Promise<unknown>, tarefa: () => Promise<T>): Promise<T> {
     return gate.catch(() => undefined).then(() => tarefa());
   }
   // duplicar esse helper no módulo gestores — mesma convenção de isolamento por módulo já usada em atribuicoes.

   const heroKpisPromise = gestorDashboardController.obterHeroKpisAgregado(executivos);
   const crossCanalPromise = depoisDe(heroKpisPromise, () =>
     gestorDashboardController.obterCrossCanalAgregado(executivos),
   );
   ```
   Os componentes `GestorReceitaTotalCard`/`GestorKpisSecundariosGrid` (já são `"use client"`, funcionam normalmente como filhos de Server Component) ficam num `<Suspense>` resolvendo `heroKpisPromise`. `GestorSaudeCarteiraCard` fica em outro `<Suspense>` resolvendo `crossCanalPromise`. Essa separação rápido/pesado é a mesma que resolveu a lentidão documentada do Executivo em 2026-08-20 — crítica pra não repetir o problema na escala do gestor (N executivos × N agências de chamadas ao SST).
2. Props de `GestorDashboardView` mudam de `{ detalhe: GestorDetalheView }` pra `{ perfil: GestorPerfil, executivos: ExecutivoComCarteira[] }` (mesmo formato de `ExecutivoDashboardView({ perfil, agencias })`).
3. Criar `gestor-hero-kpis-secao.tsx` e `gestor-saude-carteira-secao.tsx` (thin wrappers que resolvem a promise e renderizam os cards), espelhando `executivo-hero-kpis-secao.tsx`/`executivo-saude-carteira-secao.tsx`.
4. `GestorTopExecutivosCard` (ranking "melhor saúde"/"atenção") passa a usar `porExecutivo[].miniStats.vendendo30d`/`vendendo30dPct` reais em vez do hash mock (`gerarRankingExecutivos`, hoje em `gestor-detalhe.adapter.ts`).
5. **Ficam como estão (mock), sem mudança** — isso é paridade correta, não uma pendência: `GestorTopAgenciasCard`×3 (Top 10 Agências Geral/Aéreo/Terrestre) e `canalAereo`/`canalTerrestre` (cards de margem/rentabilidade). Mesmo no Executivo essas seções são mock de apresentação por design (`MargemRentabBloco` tem prop `mock?: boolean`; comentário no código cita "SPEC 3.8" pra Top 10 Agências ser mock intencional).
6. `GestorProfileHeader`: adicionar props opcionais `statsAgenciasSlot`/`statsVendendo30dSlot` (`ReactNode`), espelhando `ExecutivoProfileHeader`. `GestorDetalheShell` (compartilhado pelas 3 abas) repassa esses 2 props opcionais adiante — só a página Dashboard os preenche (via novo `criarGestorHeaderStatsSlots(crossCanalPromise)` em `gestor-header-stats.tsx`, espelhando `executivo-header-stats.tsx`). As abas Executivos/Agências continuam sem passá-los, caindo no fallback síncrono de hoje (`perfil.totalAgencias`/`vendendoUltimos30d`, que seguem mock/local) — mesma assimetria já documentada e usada no Executivo.
7. `montarGestorDashboard`/`montarGestorDetalheView` (em `gestor-detalhe.adapter.ts`) saem de uso — a página Dashboard não monta mais um objeto mock inteiro. `montarGestorPerfil` continua sendo usado (perfil rápido e síncrono, igual hoje) pelas 3 páginas.
8. `page.tsx` do Dashboard: troca a chamada a `montarGestorDetalheView(...)` por passar `perfil` (via `montarGestorPerfil`) + `dados.executivos` direto pro `GestorDashboardView`.

## 5. Aba Executivos (`/crm/gestores/[id]/executivos`)

`gestor-executivos-tab.adapter.ts` deixa de usar `gerarMetricasMock` (hash puro) e passa a consumir `porExecutivo` de `gestorDashboardController.obterAgregadoCompleto(executivos)` (chamado no `page.tsx`, que já tem `executivos` do loader existente).

| Campo (`ExecutivoDaGestaoView`) | Fonte nova                                                                                                                                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vendendo30d`                   | `porExecutivo[i].miniStats.vendendo30d` (real)                                                                                                                                                                                                   |
| `saudePercentual`               | `porExecutivo[i].miniStats.vendendo30dPct` (real)                                                                                                                                                                                                |
| `vendasMes` / `vendasAno`       | `porExecutivo[i].hero.mes.valor` / `.ano.valor` (real)                                                                                                                                                                                           |
| `semVendaAno`                   | `hero.ano.valor === 0` (real)                                                                                                                                                                                                                    |
| `paradas90d`                    | contagem de `porExecutivo[i].agenciasCarteira` com `faixaRecencia` em `"90a365d"` ou `"semVenda365d"` (real, derivado)                                                                                                                           |
| `limite`                        | soma de `limiteMock(codigo)` sobre `porExecutivo[i].agenciasCarteira` — reaproveita a mesma função mock já usada por agência no Executivo (ver seção 6), agora chaveada pelo código real da agência em vez de um número arbitrário por executivo |
| `ativo`                         | **mantido mock** (`hashParaNumero(id) % 10 !== 0`) — não existe flag real de "ativo" no schema, mesma limitação de hoje, fora de escopo                                                                                                          |

Comportamento esperado (não é regressão) pra executivos sem SICA: `hero`/`kpis`/`miniStats` continuam vindo do mock determinístico interno do próprio `executivoDashboardController` (populados normalmente), mas `agenciasCarteira` vem vazio (regra já existente: "sem SICA não há como filtrar o SST — mostra vazio em vez de inventar linhas"). Então `paradas90d`/`limite` ficam em `0` só pra essas linhas — igual já acontece hoje na própria aba Agências do Executivo sem SICA.

## 6. Aba Agências (`/crm/gestores/[id]/agencias`)

`gestor-agencias-tab.adapter.ts` reescrito pra casar cada `Agencia` local (`AgenciaResumoPromotor`, tem `cnpj`) com o registro correspondente do roster real (`AgenciaCarteiraResumo`, também tem `cnpj`):

```ts
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import {
  categoriaPorVendas,
  limiteMock,
} from "@/modules/atribuicoes/adapters/executivo-agencias.adapter"; // exportar (ver abaixo)

// Map<cnpjNormalizado, AgenciaCarteiraResumo>, construído a partir de porExecutivo[i].agenciasCarteira
// unmaskCnpj nos dois lados é seguro/idempotente independente do formato de saída do SST
// (não confirmado por payload real — ver "Pendência" abaixo).
```

- **Se casar** (mesmo CNPJ normalizado): `categoria = categoriaPorVendas(sst.vendasAno)`, `vendasAno`/`bilhetesAno` reais, `faixaRecencia` real — **substitui** o campo `diasSemComprar: number` (mock) no tipo `AgenciaDaGestaoView` por `faixaRecencia: FaixaRecencia`.
- **Se não casar** (executivo sem SICA, ou agência ainda não sincronizada no SST): cai no mock determinístico de hoje (`hashParaNumero(agencia.id)`) — fallback intencional, mesma filosofia usada em todo o resto do código (`executivoDashboardMockService`) em vez de mostrar zero/vazio.
- `executivoId`/`executivoNome`/`base`/`status`/`dadosFaltantes`/`inativada` continuam exatamente como hoje (reais, do banco local, sem mudança).
- **Exportar** `categoriaPorVendas` e `limiteMock` de `src/modules/atribuicoes/adapters/executivo-agencias.adapter.ts` (hoje são `function` sem `export` — checar antes de assumir, mas na leitura mais recente não tinham `export`). Importar essas duas em `gestor-agencias-tab.adapter.ts`.
- `GestorAgenciasTabela`: portar a renderização da coluna "Última" usando as constantes `RANK_RECENCIA`/`LABEL_RECENCIA` já existentes em `src/modules/atribuicoes/components/executivo/agencias/agencias-tabela.tsx` (Executivo), no lugar da formatação por dias.
- `GestorAgenciasFiltrosToolbar` + `src/modules/gestores/view-models/use-gestor-agencias-tab.view-model.ts`: portar o filtro "Última Compra" (opções `ate30`/`30a90`/`mais90`) da lógica já pronta em `useExecutivoAgenciasViewModel` (módulo atribuicoes), trocando o corte por `diasSemComprar` pelo bucket de `faixaRecencia`.
- Filtro **"Premiação" permanece** (diferente do Executivo, que removeu esse filtro por decisão de produto não documentada como técnica) — `categoria` continua um campo real e discreto, então o filtro continua fazendo sentido. É uma divergência intencional e pequena de UX, não um requisito técnico — não seguir o Executivo cegamente aqui.

### Pendência a resolver durante a implementação (não bloqueia o início)

O formato exato de saída do campo `cnpj` no roster do SST (`AgenciaCarteiraResumo.cnpj`, vindo de `/api/agencias/ativas`) **não foi confirmado por payload real** (não há exemplo documentado em `docs/mock-exec-resp.md`/`docs/mock-exec.md` mostrando esse campo específico). Há uma evidência indireta (não uma prova) de que o SST tende a usar CNPJ mascarado em outro endpoint irmão (`/api/agencias/cadastro?cnpj=X`, que exige o parâmetro com máscara `00.000.000/0000-00`). O CNPJ local (`Agencia.cnpj`) é confirmado **sem máscara, só dígitos** (via `unmaskCnpj()` no pipeline de escrita).

**Ação recomendada**: aplicar `unmaskCnpj()` (já existe em `@/modules/cadastro/utils/cnpj.util`, idempotente — não quebra strings já sem máscara) nos dois lados antes de montar o `Map` de join, independente do que o SST devolver. Ao implementar a aba Agências, fazer um teste manual (log/debugger) inspecionando `agenciasCarteira[0].cnpj` de um executivo real com SICA configurado, pra confirmar o formato real e documentar aqui depois.

## 7. Arquivos

### Novos

- `src/modules/gestores/utils/agregacoes-gestor.util.ts`
- `src/modules/gestores/presentation/controllers/gestor-dashboard.controller.ts`
- `src/modules/gestores/components/dashboard/gestor-header-stats.tsx`
- `src/modules/gestores/components/dashboard/gestor-hero-kpis-secao.tsx`
- `src/modules/gestores/components/dashboard/gestor-saude-carteira-secao.tsx`

### Modificados

- `src/modules/gestores/views/gestor-dashboard-view.tsx` (client → server, streaming em 2 fases)
- `src/modules/gestores/components/gestor-profile-header.tsx` (slots opcionais)
- `src/modules/gestores/components/gestor-detalhe-shell.tsx` (repassa slots)
- `src/app/(admin)/crm/gestores/[id]/page.tsx` (para de pré-montar dashboard mock)
- `src/modules/gestores/adapters/gestor-detalhe.adapter.ts` (remove `montarGestorDashboard`/`montarGestorDetalheView`; mantém `montarGestorPerfil`)
- `src/app/(admin)/crm/gestores/[id]/executivos/page.tsx` e `src/modules/gestores/adapters/gestor-executivos-tab.adapter.ts`
- `src/app/(admin)/crm/gestores/[id]/agencias/page.tsx` e `src/modules/gestores/adapters/gestor-agencias-tab.adapter.ts`
- `src/modules/gestores/types/gestor-agencias-tab.types.ts` (troca `diasSemComprar` por `faixaRecencia`)
- `src/modules/gestores/components/gestor-agencias-tabela.tsx`
- `src/modules/gestores/components/gestor-agencias-filtros-toolbar.tsx`
- `src/modules/gestores/view-models/use-gestor-agencias-tab.view-model.ts`
- `src/modules/atribuicoes/adapters/executivo-agencias.adapter.ts` (exporta `categoriaPorVendas`/`limiteMock`)

### Referência — NÃO alterar

- `src/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller.ts`
- `src/modules/atribuicoes/services/executivo-dashboard.sst-service.ts`
- `src/modules/atribuicoes/services/executivo-dashboard.mock-service.ts`
- `src/modules/atribuicoes/adapters/executivo-detalhe.adapter.ts` (`mapAgencia`)
- `src/modules/gestores/services/gestor-detalhe.loader.ts` (`carregarGestorComExecutivos` — já fornece exatamente os dados de entrada que a agregação precisa, sem mudança)

## 8. Riscos e mitigação

- **Volume de chamadas ao SST**: um gestor com N executivos multiplica por N as chamadas que hoje um único executivo já faz (~2×agências por executivo no crossCanal, por causa de um loop terrestre por agência já documentado como causa da lentidão de 2026-08-20). Mitigação: reaproveita o cache dual-layer já existente (in-mem + Valkey, TTL 10 min, chave `exec:${codigoExecutivo}:...`) sem precisar de camada de cache nova; `Promise.allSettled` garante que um subordinado lento/com erro não derruba o agregado inteiro; mantém a mesma separação hero-rápido/crossCanal-pesado em `<Suspense>` que já resolveu esse tipo de lentidão no Executivo. **Não** propor limite de concorrência (batching) agora — observar em uso real antes de adicionar essa complexidade.
- **CNPJ do SST em formato desconhecido**: ver seção 6, "Pendência".
- **`ativo` do Gestor/Executivo permanece mock**: não existe flag real no schema (`Gestor`/`Promotor` não têm campo de status ativo/inativo) — fora de escopo resolver isso aqui.

## 9. Verificação (checklist pra rodar depois de implementar)

1. Escolher um Gestor real com ≥2 executivos subordinados, sendo pelo menos um com `sica` e `SST_API_KEY` configurada. Abrir `/crm/gestores/[id]` e conferir que Hero/KPIs batem com a soma manual dos mesmos números abertos em `/crm/executivos/[id]` de cada subordinado.
2. Confirmar visualmente que a seção Hero/KPIs aparece antes da seção Saúde da Carteira (fallback de Suspense visível brevemente), replicando a UX do Executivo.
3. Caso-limite: Gestor sem nenhum subordinado com SICA → dashboard deve renderizar (agregado 100% mock por baixo dos panos), sem erro.
4. Caso-limite: Gestor sem nenhum subordinado → estado zerado, sem `NaN`/`Infinity` em nenhum card.
5. Aba Executivos: valores de `vendendo30d`/`vendasMes`/`vendasAno`/`saudePercentual` de uma linha devem bater exatamente com os números abertos na própria tela daquele executivo (mesma chamada, mesmo cache).
6. Aba Agências: agências ligadas ao SST mostram `categoria`/`vendasAno`/"Última" reais; agências sem match (ou de executivo sem SICA) mostram fallback mock plausível (não zero/vazio).
7. Rodar o typecheck do projeto (`npx tsc --noEmit` ou script equivalente do `package.json`) depois das mudanças de tipo em `gestor-agencias-tab.types.ts`.

## 10. Ordem sugerida de implementação

1. `agregacoes-gestor.util.ts` (funções puras, sem I/O — dá pra validar isoladamente antes de tudo).
2. `gestor-dashboard.controller.ts` (orquestração) — validar manualmente com um gestor real de 1-2 executivos.
3. Exportar `categoriaPorVendas`/`limiteMock` de `executivo-agencias.adapter.ts` (mudança trivial, pode ser feita a qualquer momento).
4. Dashboard: slots em `GestorProfileHeader`/`GestorDetalheShell` (não quebra nada, são opcionais) → reescrever `gestor-dashboard-view.tsx` → criar as 2 seções novas → ajustar `page.tsx`. Validar essa aba isoladamente antes de seguir.
5. Aba Executivos: reescrever adapter + página, reaproveitando `obterAgregadoCompleto`.
6. Aba Agências: tipos (`faixaRecencia`), adapter (join por CNPJ), view-model, toolbar, tabela — por último, pois depende do roster consolidado (`agenciasCarteira`) já disponível desde o passo 2.
