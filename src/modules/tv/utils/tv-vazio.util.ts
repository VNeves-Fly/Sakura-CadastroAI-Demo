import type {
  CanalTv,
  CompanhiaShareTv,
  PeriodoTv,
  Top10LinhaTv,
  TvData,
  VendasResumoTv,
} from "@/modules/tv/types/tv.types";

// "0/vazio honesto" pro painel de TV quando SST_API_KEY não está
// configurada, ou quando uma seção falha contra o SST mesmo com a chave
// presente — mesmo espírito de executivo-dashboard-vazio.util.ts e
// dashboard-vendas-vazio.util.ts. Até 2026-08-25 os dois casos caíam pro
// tv.mock-service.ts (número plausível, inventado, sem nenhum aviso na
// tela — ver comentário em tv-header.tsx); decisão do usuário nessa data:
// nunca mais disfarçar dado ausente com mock. Diferente dos outros dois
// módulos, aqui TODO campo de TvData tem fonte real documentada em
// tv.sst-service.ts — não há nenhum "mock permanente" a preservar.

const PERIODOS: PeriodoTv[] = ["hoje", "ontem", "mes", "ano"];

function porPeriodoVazio<T>(valor: () => T): Record<PeriodoTv, T> {
  return Object.fromEntries(
    PERIODOS.map((periodo): [PeriodoTv, T] => [periodo, valor()]),
  ) as Record<PeriodoTv, T>;
}

function vendasResumoVazio(): VendasResumoTv {
  return { valorTotal: 0, margemPct: 0 };
}

function canalVazio(): CanalTv {
  return { valorTotal: 0, bilhetes: 0, agencias: 0, ticketMedio: 0, nacPct: 0, intlPct: 0 };
}

export function vendasECanaisVazio(): Pick<TvData, "vendas" | "aereo" | "terrestre"> {
  return {
    vendas: { hoje: vendasResumoVazio(), mes: vendasResumoVazio(), ano: vendasResumoVazio() },
    aereo: porPeriodoVazio(canalVazio),
    terrestre: porPeriodoVazio(canalVazio),
  };
}

export function shareAereoVazio(): Record<PeriodoTv, CompanhiaShareTv[]> {
  return porPeriodoVazio<CompanhiaShareTv[]>(() => []);
}

export function top10Vazio(): Pick<
  TvData,
  "top10Clientes" | "top10Nacional" | "top10Internacional"
> {
  return {
    top10Clientes: porPeriodoVazio<Top10LinhaTv[]>(() => []),
    top10Nacional: porPeriodoVazio<Top10LinhaTv[]>(() => []),
    top10Internacional: porPeriodoVazio<Top10LinhaTv[]>(() => []),
  };
}

export function tvDadosVazios(): TvData {
  return { ...vendasECanaisVazio(), shareAereo: shareAereoVazio(), ...top10Vazio() };
}
