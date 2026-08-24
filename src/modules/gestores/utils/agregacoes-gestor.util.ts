// Agregação pura (sem I/O) da carteira do Gestor a partir dos dashboards
// individuais dos executivos subordinados (ver
// gestor-dashboard.controller.ts, que chama essas funções depois de buscar
// hero/kpis/crossCanal por executivo via executivoDashboardController). O
// Gestor não tem carteira própria — a soma dos subordinados É o número
// dele (docs/plano-gestores-backend.md §1).
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import type {
  CanalMargemPeriodo,
  CanalMargemResumo,
  CrossCanal,
  KpisSecundarios,
  MargemRentabExecutivo,
  MiniStats,
  PeriodoVendasMesHero,
  SegmentoComLista,
  SegmentoSaude,
  VendasMesHero,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";
import type {
  CanalMargemPeriodoGestor,
  CanalMargemResumoGestor,
  KpisSecundariosGestor,
  MargemRentabGestor,
  PeriodoVendasMesHeroGestor,
  RankingExecutivoSaude,
  VendasMesHeroGestor,
} from "@/modules/gestores/types/gestor-detalhe.types";

// Soma um período do hero (dia/ontem/mes/ano) de N executivos.
function somarPeriodoHero(periodos: VendasMesHero[]): VendasMesHeroGestor {
  let somaValor = 0;
  let somaBilhetes = 0;
  let somaAgenciasVendendo = 0;
  let somaValorAnterior = 0;

  for (const p of periodos) {
    somaValor += p.valor;
    somaBilhetes += p.bilhetes;
    somaAgenciasVendendo += p.agenciasVendendo; // seguro: cada agência pertence a 1 único executivo
    const fator = 1 + p.variacaoPct / 100;
    // reconstrói o valor do período anterior a partir de valor_i e
    // variacaoPct_i: variacaoPct_i = (valor_i - anterior_i) / anterior_i * 100
    // => anterior_i = valor_i / (1 + variacaoPct_i/100)
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

export function somarHeroTodosPeriodos(
  heroList: Record<PeriodoVendasMesHero, VendasMesHero>[],
): Record<PeriodoVendasMesHeroGestor, VendasMesHeroGestor> {
  const periodos: PeriodoVendasMesHero[] = ["dia", "ontem", "mes", "ano"];
  return Object.fromEntries(
    periodos.map((periodo) => [periodo, somarPeriodoHero(heroList.map((h) => h[periodo]))]),
  ) as Record<PeriodoVendasMesHeroGestor, VendasMesHeroGestor>;
}

// Duplicado de propósito (isolamento de módulo, mesmo princípio do resto
// deste projeto) — mesma fórmula de calcularVariacaoPct em
// executivo-dashboard.sst-service.ts (não exportada de lá).
function calcularVariacaoPct(atual: number, anterior: number): number {
  return anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
}

// Soma um canal (total/aereo/terrestre) de N executivos a partir dos
// componentes BRUTOS (valor/valorLY/rentabValor/rentabLYValor/
// nacionalValor — todos reais, vindos do SST via
// executivo-dashboard.sst-service.ts) e reconstrói margemPct/margemLYPct/
// nacPct a partir dos totais agregados — nunca faz média de percentuais
// individuais (um executivo pequeno com margem de 50% não pode pesar
// igual a um grande com margem de 5%, mesma regra já aplicada em
// somarKpis/mesAnteriorPercentualAtingido acima).
function somarCanalMargem(canais: CanalMargemPeriodo[]): CanalMargemPeriodoGestor {
  const valor = canais.reduce((s, c) => s + c.valor, 0);
  const valorLY = canais.reduce((s, c) => s + c.valorLY, 0);
  const quantidade = canais.reduce((s, c) => s + c.quantidade, 0);
  const rentabValor = canais.reduce((s, c) => s + c.rentabValor, 0);
  const rentabLYValor = canais.reduce((s, c) => s + c.rentabLYValor, 0);
  const nacionalValor = canais.reduce((s, c) => s + c.nacionalValor, 0);

  const margemPct = valor > 0 ? (rentabValor / valor) * 100 : 0;
  const margemLYPct = valorLY > 0 ? (rentabLYValor / valorLY) * 100 : 0;
  const nacPct = valor > 0 ? Math.round((nacionalValor / valor) * 1000) / 10 : 0;

  return {
    valor,
    quantidade,
    margemPct: Math.round(margemPct * 100) / 100,
    margemLYPct: Math.round(margemLYPct * 100) / 100,
    margemVariacaoPct: Math.round(calcularVariacaoPct(margemPct, margemLYPct) * 100) / 100,
    rentabValor,
    rentabLYValor,
    rentabLYVariacaoPct: Math.round(calcularVariacaoPct(rentabValor, rentabLYValor) * 100) / 100,
    ticketMedio: quantidade > 0 ? Math.round(valor / quantidade) : 0,
    nacPct,
    intPct: Math.round((100 - nacPct) * 10) / 10,
  };
}

function somarCanalMargemResumo(resumos: CanalMargemResumo[]): CanalMargemResumoGestor {
  return {
    total: somarCanalMargem(resumos.map((r) => r.total)),
    aereo: somarCanalMargem(resumos.map((r) => r.aereo)),
    terrestre: somarCanalMargem(resumos.map((r) => r.terrestre)),
  };
}

export function somarMargemRentab(list: MargemRentabExecutivo[]): MargemRentabGestor {
  const periodos: PeriodoVendasMesHeroGestor[] = ["dia", "ontem", "mes", "ano"];
  return Object.fromEntries(
    periodos.map((periodo) => [periodo, somarCanalMargemResumo(list.map((m) => m[periodo]))]),
  ) as MargemRentabGestor;
}

// vendendo30dRapido/vendendo30dPctRapido = perfil.vendendoUltimos30d/Pct
// (GestorPerfil, rápido/síncrono/mock) — NÃO vem do agregado real. O valor
// real agregado (miniStats.vendendo30d/Pct) só aparece no header via
// statsVendendo30dSlot depois que a promise pesada resolve — mesma
// assimetria já usada no dashboard do Executivo (intencional).
export function somarKpis(
  kpisList: KpisSecundarios[],
  mesAtualValorAgregado: number,
  vendendo30dRapido: number,
  vendendo30dPctRapido: number,
): KpisSecundariosGestor {
  const mesAnteriorValor = kpisList.reduce((s, k) => s + k.mesAnteriorValor, 0);
  const projecaoFimMes = kpisList.reduce((s, k) => s + k.projecaoFimMes, 0);
  return {
    mesAnteriorValor,
    mesAnteriorFaltaValor: Math.max(0, mesAnteriorValor - mesAtualValorAgregado),
    // razão dos TOTAIS agregados, nunca média das razões individuais — um
    // executivo pequeno com 200% de atingimento não pode distorcer a média
    // como distorceria uma média simples de percentuais.
    mesAnteriorPercentualAtingido:
      mesAnteriorValor > 0 ? Math.round((mesAtualValorAgregado / mesAnteriorValor) * 100) : 0,
    projecaoFimMes,
    vendendo30d: vendendo30dRapido,
    vendendo30dPct: vendendo30dPctRapido,
  };
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

export function somarCrossCanal(list: CrossCanal[]): CrossCanal {
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

// Confirmado: classificação ativas/potenciais/ociosas/inativas é por regra
// ABSOLUTA por agência (não relativa ao roster do executivo) — ver
// executivo-dashboard.sst-service.ts, construirSaudeCarteira(). Por isso é
// seguro somar quantidade + concatenar listas por chave.
export function somarSaudeCarteira(list: SegmentoSaude[][]): SegmentoSaude[] {
  const chaves = ["ativas", "potenciais", "ociosas", "inativas"] as const;
  const totalConsolidado = list.reduce(
    (s, segs) => s + segs.reduce((s2, seg) => s2 + seg.quantidade, 0),
    0,
  );
  return chaves.map((chave) => {
    const segmentosDaChave = list
      .map((segs) => segs.find((s) => s.chave === chave))
      .filter((s): s is SegmentoSaude => s != null);
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

// Ranking "Top 5 executivos" (melhor saúde / atenção) a partir do
// miniStats REAL de cada executivo (vendendo30d/vendendo30dPct, vindo de
// obterCrossCanalAgregado) — substitui o antigo gerarRankingExecutivos
// (mock por hash) do gestor-detalhe.adapter.ts.
export function construirRankingExecutivos(
  executivos: { id: string; nome: string }[],
  porExecutivo: { id: string; miniStats: MiniStats }[],
): RankingExecutivoSaude[] {
  const statsPorId = new Map(porExecutivo.map((p) => [p.id, p.miniStats]));
  return executivos.map((executivo) => {
    const stats = statsPorId.get(executivo.id);
    return {
      id: executivo.id,
      nome: executivo.nome,
      vendendo: stats?.vendendo30d ?? 0,
      total: stats?.agencias ?? 0,
      pct: stats?.vendendo30dPct ?? 0,
    };
  });
}
