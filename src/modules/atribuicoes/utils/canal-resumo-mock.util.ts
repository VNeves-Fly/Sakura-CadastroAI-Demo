import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { ExecutivoAgenciaResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";

// Mock puro de apresentação — hoje só cobre o que genuinamente não tem
// fonte real no SST: os rankings "Top 10 Agências (Hoje)" (SST não expõe
// venda "de hoje" por agência) e o timestamp de "Atualizado em" (sem campo
// de sincronização exposto). Margem/rentabilidade por canal deixaram de
// ser mock aqui em 2026-08-24 — o SST já expunha esses dados reais
// (`margem`/`rentabilidade`/`ticket_medio`/`nacInter` em
// GET /api/consolidado/overview, filtrado por codigoExecutivo), só não
// eram lidos; ver `CanalResumo`/`gerarCanalAereo`/`gerarCanalTerrestre`
// removidos daqui e substituídos por `margemRentab` em
// executivo-dashboard.sst-service.ts.

export interface RankingAgenciaHoje {
  posicao: number;
  nome: string;
  valor: number;
  quantidade: number;
}

// "Atualizado em DD/MM às HH:mm" (SPEC 3.5) — deslocamento determinístico
// (5 a ~185 min) a partir de agora, só pra não mostrar sempre o mesmo
// horário fixo pra todo executivo.
export function gerarAtualizadoEm(base: number): string {
  const minutosAtras = 5 + (base % 180);
  const data = new Date(Date.now() - minutosAtras * 60_000);
  const doisDigitos = (n: number) => String(n).padStart(2, "0");
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)} às ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

// Rankings "Top 10 Agências" (SPEC 3.8) — sempre "hoje", por modalidade.
function gerarRankingHoje(
  agencias: ExecutivoAgenciaResumo[],
  seedBase: number,
  valorMaximo: number,
  ticketMedio: number,
): RankingAgenciaHoje[] {
  return agencias
    .map((agencia, indice) => {
      const seed = hashParaNumero(agencia.id + seedBase + indice);
      const valor = 500 + (seed % valorMaximo);
      return {
        nome: agencia.nome,
        valor,
        quantidade: Math.max(1, Math.round(valor / ticketMedio)),
      };
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)
    .map((item, indice) => ({ posicao: indice + 1, ...item }));
}

export interface RankingsHojeExecutivo {
  topAgenciasHoje: RankingAgenciaHoje[];
  topAgenciasHojeAereo: RankingAgenciaHoje[];
  topAgenciasHojeTerrestre: RankingAgenciaHoje[];
}

export function gerarRankingsHoje(
  agencias: ExecutivoAgenciaResumo[],
  base: number,
): RankingsHojeExecutivo {
  return {
    topAgenciasHoje: gerarRankingHoje(agencias, base + 801, 350_000, 1_200),
    topAgenciasHojeAereo: gerarRankingHoje(agencias, base + 902, 340_000, 2_400),
    topAgenciasHojeTerrestre: gerarRankingHoje(agencias, base + 1_003, 13_000, 500),
  };
}
