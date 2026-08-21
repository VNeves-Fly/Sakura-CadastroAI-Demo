import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { ExecutivoAgenciaResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";

// Mock puro de apresentação pro card "Receita total" (SPEC 3.5+3.6) — NÃO
// faz parte do pipeline mock↔real do dashboard (controller/mock-service/
// sst-service, ver executivo-dashboard.controller.ts). Margem/rentab. por
// canal e os rankings "Top 10 (Hoje)" não têm fonte real hoje (o SST não
// expõe margem nem venda "de hoje" por agência); ficam mock aqui, isolados
// dos arquivos que o time de integração real mantém, até o backend expor
// esse dado — só então isso deveria virar uma chamada de serviço de
// verdade.

export interface CanalResumo {
  participacaoPct: number; // % do valor total do período
  margemPct: number;
  margemLYPct: number;
  margemVariacaoPct: number;
  rentabLYPct: number; // RENTAB. LY como % do valor do canal no período
  rentabLYVariacaoPct: number;
  ticketMedio: number; // valor médio por bilhete/venda — estável entre períodos
  nacPct: number;
  intPct: number;
}

export interface RankingAgenciaHoje {
  posicao: number;
  nome: string;
  valor: number;
  quantidade: number;
}

// Aéreo concentra quase todo o volume com margem mais baixa; Terrestre é
// o inverso (pouco volume, margem maior) — mesma relação do exemplo
// aprovado na SPEC.
export function gerarCanalAereo(base: number): CanalResumo {
  const nacPct = Math.round((28 + (base % 25)) * 10) / 10;
  const margemPct = Math.round((2.6 + ((base >> 3) % 25) / 10) * 100) / 100;
  const margemNegativa = (base >> 9) % 5 === 0;
  return {
    participacaoPct: Math.round((95 + ((base >> 5) % 45) / 10) * 100) / 100,
    margemPct,
    margemLYPct: Math.round((margemPct - (0.2 + ((base >> 7) % 12) / 10)) * 100) / 100,
    margemVariacaoPct:
      (margemNegativa ? -1 : 1) * (Math.round((5 + ((base >> 9) % 250) / 10) * 100) / 100),
    rentabLYPct: Math.round((1.8 + ((base >> 11) % 60) / 10) * 100) / 100,
    rentabLYVariacaoPct: Math.round((15 + ((base >> 13) % 550) / 10) * 100) / 100,
    ticketMedio: 1_900 + (base % 1_600),
    nacPct,
    intPct: Math.round((100 - nacPct) * 10) / 10,
  };
}

export function gerarCanalTerrestre(base: number, participacaoAereoPct: number): CanalResumo {
  const nacPct = Math.round((75 + ((base >> 2) % 20)) * 10) / 10;
  const margemPct = Math.round((8 + ((base >> 4) % 60) / 10) * 100) / 100;
  const margemNegativa = base % 2 === 0;
  return {
    participacaoPct: Math.round((100 - participacaoAereoPct) * 100) / 100,
    margemPct,
    margemLYPct: Math.round((margemPct + (1 + ((base >> 6) % 30) / 10)) * 100) / 100,
    margemVariacaoPct:
      (margemNegativa ? -1 : 1) * (Math.round((5 + ((base >> 8) % 220) / 10) * 100) / 100),
    rentabLYPct: Math.round((6 + ((base >> 10) % 90) / 10) * 100) / 100,
    rentabLYVariacaoPct: Math.round((2 + ((base >> 12) % 60) / 10) * 100) / 100,
    ticketMedio: 350 + (base % 500),
    nacPct,
    intPct: Math.round((100 - nacPct) * 10) / 10,
  };
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
