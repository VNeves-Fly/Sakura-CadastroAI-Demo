import type { AgenciaCarteiraResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";

// Hoje só cobre o que genuinamente não tem fonte real no SST: o timestamp
// de "Atualizado em" (sem campo de sincronização exposto). Margem/
// rentabilidade por canal deixaram de ser mock aqui em 2026-08-24, e os
// rankings "Top 10 Agências (Hoje)" em 2026-08-24 também — o comentário
// antigo dizia "SST não expõe venda de hoje por agência", mas o mesmo
// endpoint agrupado por empresa (GET /api/consolidado/air/resumo-agrupado,
// filtrado por codigoExecutivo, com startDate=endDate=hoje) já tinha esse
// dado, testado ao vivo — ver construirRankingsHojeAgencias abaixo e
// executivo-dashboard.sst-service.ts.

export interface RankingAgenciaHoje {
  posicao: number;
  nome: string;
  valor: number;
  quantidade: number;
}

export interface RankingsHojeExecutivo {
  topAgenciasHoje: RankingAgenciaHoje[];
  topAgenciasHojeAereo: RankingAgenciaHoje[];
  topAgenciasHojeTerrestre: RankingAgenciaHoje[];
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

function construirRankingHoje(
  agencias: AgenciaCarteiraResumo[],
  valorDe: (a: AgenciaCarteiraResumo) => number,
  quantidadeDe: (a: AgenciaCarteiraResumo) => number,
): RankingAgenciaHoje[] {
  return agencias
    .map((a) => ({ nome: a.nome, valor: valorDe(a), quantidade: quantidadeDe(a) }))
    .filter((item) => item.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)
    .map((item, indice) => ({ posicao: indice + 1, ...item }));
}

// Rankings "Top 10 Agências (Hoje)" (SPEC 3.8) reais — derivados de
// `agenciasCarteira` (já real, mesma lista da aba "Agências"), não de uma
// chamada nova ao SST. "Geral" soma aéreo+terrestre por agência antes de
// ordenar (os dois indexam por `codigo`, não por nome — cruzamento seguro).
export function construirRankingsHojeAgencias(
  agenciasCarteira: AgenciaCarteiraResumo[],
): RankingsHojeExecutivo {
  return {
    topAgenciasHoje: construirRankingHoje(
      agenciasCarteira,
      (a) => a.vendasHojeAereo + a.vendasHojeTerrestre,
      (a) => a.bilhetesHojeAereo + a.bilhetesHojeTerrestre,
    ),
    topAgenciasHojeAereo: construirRankingHoje(
      agenciasCarteira,
      (a) => a.vendasHojeAereo,
      (a) => a.bilhetesHojeAereo,
    ),
    topAgenciasHojeTerrestre: construirRankingHoje(
      agenciasCarteira,
      (a) => a.vendasHojeTerrestre,
      (a) => a.bilhetesHojeTerrestre,
    ),
  };
}
