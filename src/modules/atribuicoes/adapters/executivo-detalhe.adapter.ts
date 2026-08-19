import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { AgenciaResumoPromotor } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { PromotorProps } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";
import type {
  AgenciaSegmentoResumo,
  ExecutivoAgenciaResumo,
  ExecutivoDetalheView,
  LoyaltyChip,
  PeriodoVendasMesHero,
  SegmentoSaude,
  VendaMensal,
  VendasMesHero,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

const MESES_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

// Companhias aéreas do exemplo da SPEC (seção 4.4) — lista fixa (não há
// fonte real de "fidelidade por companhia" ligada a Promotor/Agencia
// hoje), contagem mockada por hash.
const COMPANHIAS_AEREAS = [
  "LATAM",
  "GOL",
  "AZUL",
  "TAP",
  "AMERICAN INC.",
  "UNITED",
  "AIR FRANCE",
  "ITA",
  "LUFTHANSA",
  "AEROLINEAS ARGENTINAS",
  "DELTA INC.",
  "AVIANCA",
  "SWISS",
];

export function mapAgencia(agencia: AgenciaResumoPromotor): ExecutivoAgenciaResumo {
  return {
    id: agencia.id,
    nome: agencia.razaoSocial,
    cnpj: agencia.cnpj,
    status: agencia.status,
    criadoEm: agencia.createdAt,
  };
}

// Divide `total` em `pesos.length` partes inteiras proporcionais aos
// pesos, garantindo que a soma bate exatamente com `total` (o resto vai
// pro último grupo) — usado pra particionar a carteira em segmentos mock
// sem "sobrar"/"faltar" agência na conta. Tipo genérico `const T` preserva
// o tamanho da tupla de entrada, então desestruturar o resultado é
// type-safe (sem `number | undefined`).
function particionar<const T extends number[]>(
  total: number,
  pesos: T,
): { [K in keyof T]: number } {
  const somaPesos = pesos.reduce((acc, peso) => acc + peso, 0);
  if (total === 0 || somaPesos === 0) {
    return pesos.map(() => 0) as { [K in keyof T]: number };
  }

  const partes = pesos.map((peso) => Math.floor((total * peso) / somaPesos));
  const somaParcial = partes.reduce((acc, parte) => acc + parte, 0);
  partes[partes.length - 1] = (partes[partes.length - 1] ?? 0) + (total - somaParcial);
  return partes as { [K in keyof T]: number };
}

function gerarConquistas(total: number, base: number) {
  const [agencias10m, agencias1m, agencias100k, agencias10k, agenciasSemVenda] = particionar(
    total,
    [
      1 + (base % 3),
      3 + ((base >> 2) % 5),
      6 + ((base >> 4) % 8),
      8 + ((base >> 6) % 10),
      2 + ((base >> 8) % 6),
    ],
  );
  return { agencias10m, agencias1m, agencias100k, agencias10k, agenciasSemVenda };
}

// Card hero (SPEC 4.1) com filtro Dia/Ontem/Mês/Ano — cada período tem seu
// próprio mock determinístico a partir do valor mensal já calculado:
// dia/ontem fatiam esse total por ~30 dias, ano espelha o mesmo
// multiplicador do acumulado anual dos KPIs secundários (ver chamada em
// montarExecutivoDetalheView).
function gerarHeroPorPeriodo(
  base: number,
  valorMesAtual: number,
  bilhetesMes: number,
  variacaoPct: number,
  vendendoUltimos30d: number,
  totalAgencias: number,
): Record<PeriodoVendasMesHero, VendasMesHero> {
  const diasNoMes = 28 + (base % 3);
  const diaValor = Math.round(valorMesAtual / diasNoMes);
  const diaBilhetes = Math.max(1, Math.round(bilhetesMes / diasNoMes));
  const fatorOntem = 0.7 + ((base >> 2) % 60) / 100;
  const anoMultiplicador = 6 + (base % 6);

  return {
    dia: {
      valor: diaValor,
      bilhetes: diaBilhetes,
      agenciasVendendo: Math.max(1, Math.round(vendendoUltimos30d * 0.2)),
      variacaoPct,
    },
    ontem: {
      valor: Math.round(diaValor * fatorOntem),
      bilhetes: Math.max(1, Math.round(diaBilhetes * fatorOntem)),
      agenciasVendendo: Math.max(1, Math.round(vendendoUltimos30d * 0.18)),
      variacaoPct,
    },
    mes: {
      valor: valorMesAtual,
      bilhetes: bilhetesMes,
      agenciasVendendo: vendendoUltimos30d,
      variacaoPct,
    },
    ano: {
      valor: Math.round(valorMesAtual * anoMultiplicador),
      bilhetes: bilhetesMes * anoMultiplicador,
      agenciasVendendo: totalAgencias,
      variacaoPct,
    },
  };
}

function gerarFidelidadePorCompanhia(base: number): LoyaltyChip[] {
  return COMPANHIAS_AEREAS.map((companhia, indice) => ({
    companhia,
    quantidade: 3 + ((base >> indice) % 40),
    destaque: false,
  }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .map((chip, indice) => ({ ...chip, destaque: indice === 0 }));
}

function gerarVendasMensais(base: number, valorMesAtual: number): VendaMensal[] {
  const hoje = new Date();
  const mesAtual = hoje.getMonth(); // 0-11
  const anoCurto = String(hoje.getFullYear()).slice(-2);

  return Array.from({ length: mesAtual + 1 }, (_, indiceMes) => {
    const seed = base + indiceMes * 97;
    const ehMesAtual = indiceMes === mesAtual;
    const nacional = ehMesAtual
      ? Math.round(valorMesAtual * 0.75)
      : Math.round(valorMesAtual * (0.5 + (seed % 60) / 100));
    const internacional = Math.round(nacional * (0.15 + ((seed >> 3) % 30) / 100));
    const terrestre = Math.round(nacional * (0.01 + ((seed >> 5) % 4) / 100));

    return { mes: `${MESES_PT[indiceMes]}/${anoCurto}`, nacional, internacional, terrestre };
  });
}

function gerarTendencia30d(base: number, mediaDiaria: number): number[] {
  return Array.from({ length: 30 }, (_, dia) => {
    const seed = base + dia * 31;
    return Math.max(0, Math.round(mediaDiaria * (0.4 + (seed % 120) / 100)));
  });
}

// Nomes/CNPJs só pra preencher as listas dos modais de "ver lista"
// (cross-canal e saúde da carteira, seção abaixo) — claramente sintéticos
// (CNPJ com dígito verificador não validado), sem fonte real (ver
// comentário no topo do arquivo).
const PREFIXOS_AGENCIA_MOCK = [
  "Turismo",
  "Viagens",
  "Tour",
  "Travel",
  "Turismundo",
  "Destinos",
  "Rotas",
  "Voyage",
];
const SUFIXOS_AGENCIA_MOCK = ["SP", "RJ", "FLN", "BSB", "CWB", "POA", "BHZ", "SSA", "REC", "MAO"];

function gerarCnpjMock(seed: number): string {
  const digitos = String(10_000_000_000_000 + (seed % 89_999_999_999_999)).padStart(14, "0");
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12, 14)}`;
}

function gerarListaAgenciasSegmento(quantidade: number, seedBase: number): AgenciaSegmentoResumo[] {
  return Array.from({ length: quantidade }, (_, indice) => {
    const seed = seedBase + indice * 53;
    const prefixo = PREFIXOS_AGENCIA_MOCK[seed % PREFIXOS_AGENCIA_MOCK.length]!;
    const sufixo = SUFIXOS_AGENCIA_MOCK[(seed >> 3) % SUFIXOS_AGENCIA_MOCK.length]!;
    return {
      nome: `${prefixo} ${sufixo} ${100 + (seed % 900)}`,
      cnpj: gerarCnpjMock(seed),
      valor: 5_000 + (seed % 300_000),
    };
  });
}

function gerarSaudeCarteira(total: number, base: number): SegmentoSaude[] {
  const [ativas, potenciais, ociosas, inativas] = particionar(total, [
    5 + (base % 10),
    2 + ((base >> 2) % 6),
    1 + ((base >> 4) % 4),
    1 + ((base >> 6) % 5),
  ]);
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  return [
    {
      chave: "ativas",
      label: "Ativas c/ crédito",
      descricao: "Vendendo nos últimos 30d",
      quantidade: ativas,
      pct: pct(ativas),
      agencias: gerarListaAgenciasSegmento(ativas, base + 101),
    },
    {
      chave: "potenciais",
      label: "Potenciais (s/ limite)",
      descricao: "Vendem sem crédito",
      quantidade: potenciais,
      pct: pct(potenciais),
      agencias: gerarListaAgenciasSegmento(potenciais, base + 202),
    },
    {
      chave: "ociosas",
      label: "Ociosas (limite parado)",
      descricao: "Sem compra há +90d",
      quantidade: ociosas,
      pct: pct(ociosas),
      agencias: gerarListaAgenciasSegmento(ociosas, base + 303),
    },
    {
      chave: "inativas",
      label: "Inativas",
      descricao: "Nunca compraram",
      quantidade: inativas,
      pct: pct(inativas),
      agencias: gerarListaAgenciasSegmento(inativas, base + 404),
    },
  ];
}

export function montarExecutivoDetalheView(
  promotor: PromotorProps,
  gestoresPorId: Map<string, GestorOpcao>,
  agenciasRaw: AgenciaResumoPromotor[],
): ExecutivoDetalheView {
  const base = hashParaNumero(promotor.id);
  const agencias = agenciasRaw.map(mapAgencia);
  const totalAgencias = agencias.length;

  const vendendoUltimos30d = Math.round(totalAgencias * (0.3 + (base % 50) / 100));
  const vendendoUltimos30dPct =
    totalAgencias > 0 ? Math.round((vendendoUltimos30d / totalAgencias) * 100) : 0;

  const valorMesAtual = ((base % 900) + 80) * 25_000;
  const bilhetesMes = Math.max(1, Math.round(valorMesAtual / (1_800 + (base % 900))));
  const variacaoPct = ((base % 40) - 20) / 10;

  const mesAnteriorValor = Math.round(valorMesAtual * (0.85 + ((base >> 3) % 30) / 100));
  const percentualAtingido =
    mesAnteriorValor > 0 ? Math.round((valorMesAtual / mesAnteriorValor) * 100) : 0;

  const ativasUltimos12m = Math.round(totalAgencias * (0.4 + ((base >> 7) % 40) / 100));
  const [soAereoQtd, soTerrestreQtd, ambosQtd] = particionar(ativasUltimos12m, [
    5 + (base % 10),
    1 + ((base >> 2) % 3),
    3 + ((base >> 4) % 6),
  ]);
  const pctCanal = (n: number) =>
    ativasUltimos12m > 0 ? Math.round((n / ativasUltimos12m) * 1000) / 10 : 0;

  const paradasCandidatas = agencias.filter((_, indice) => (base + indice) % 3 === 0).slice(0, 20);
  const emQuedaCandidatas = agencias.filter((_, indice) => (base + indice) % 4 === 0).slice(0, 20);

  return {
    perfil: {
      id: promotor.id,
      nome: promotor.nome,
      sica: promotor.sica,
      email: promotor.email,
      bases: promotor.bases,
      gestorNome: promotor.gestorId ? (gestoresPorId.get(promotor.gestorId)?.nome ?? null) : null,
      totalAgencias,
      vendendoUltimos30d,
      vendendoUltimos30dPct,
      conquistas: gerarConquistas(totalAgencias, base),
    },
    dashboard: {
      hero: gerarHeroPorPeriodo(
        base,
        valorMesAtual,
        bilhetesMes,
        variacaoPct,
        vendendoUltimos30d,
        totalAgencias,
      ),
      kpis: {
        mesAnteriorValor,
        mesAnteriorFaltaValor: Math.max(0, mesAnteriorValor - valorMesAtual),
        mesAnteriorPercentualAtingido: percentualAtingido,
        projecaoFimMes: Math.round(valorMesAtual * (1.15 + ((base >> 5) % 20) / 100)),
        acumuladoAnoValor: Math.round(valorMesAtual * (6 + (base % 6))),
        acumuladoAnoBilhetes: bilhetesMes * (6 + (base % 6)),
        ticketMedio30d: Math.round(valorMesAtual / bilhetesMes),
      },
      miniStats: {
        agencias: totalAgencias,
        vendendo30d: vendendoUltimos30d,
        vendendo30dPct: vendendoUltimos30dPct,
        ociosasLimite: Math.round(totalAgencias * (0.05 + ((base >> 6) % 15) / 100)),
        comCredito: Math.round(totalAgencias * (0.4 + ((base >> 8) % 40) / 100)),
      },
      fidelidadePorCompanhia: gerarFidelidadePorCompanhia(base),
      vendasMensais: gerarVendasMensais(base, valorMesAtual),
      vendasMensaisTotalAno: Math.round(valorMesAtual * (6 + (base % 6))),
      vendasMensaisVariacaoAltaPct: 5 + (base % 25),
      vendasMensaisVariacaoBaixaPct: 5 + ((base >> 3) % 90),
      tendencia30d: gerarTendencia30d(base, valorMesAtual / 30),
      tendencia30dTotal: valorMesAtual,
      crossCanal: {
        ativasUltimos12m,
        aprovadas: totalAgencias,
        volAereo: Math.round(valorMesAtual * 0.92),
        volTerrestre: Math.round(valorMesAtual * 0.03),
        soAereo: {
          quantidade: soAereoQtd,
          pct: pctCanal(soAereoQtd),
          agencias: gerarListaAgenciasSegmento(soAereoQtd, base + 501),
        },
        soTerrestre: {
          quantidade: soTerrestreQtd,
          pct: pctCanal(soTerrestreQtd),
          agencias: gerarListaAgenciasSegmento(soTerrestreQtd, base + 602),
        },
        ambos: {
          quantidade: ambosQtd,
          pct: pctCanal(ambosQtd),
          agencias: gerarListaAgenciasSegmento(ambosQtd, base + 703),
        },
      },
      saudeCarteira: gerarSaudeCarteira(totalAgencias, base),
      topAgenciasMes: agencias
        .map((agencia, indice) => ({
          nome: agencia.nome,
          valor: 5_000 + (hashParaNumero(agencia.id + indice) % 400_000),
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 20)
        .map((item, indice) => ({ posicao: indice + 1, ...item })),
      topAgenciasAno: agencias
        .map((agencia, indice) => ({
          nome: agencia.nome,
          valor: 50_000 + (hashParaNumero(agencia.id + "ano" + indice) % 4_000_000),
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 20)
        .map((item, indice) => ({ posicao: indice + 1, ...item })),
      paradasComHistorico: paradasCandidatas.map((agencia, indice) => {
        const seed = hashParaNumero(agencia.id + "parada" + indice);
        return {
          nome: agencia.nome,
          cnpj: agencia.cnpj,
          volume365d: 20_000 + (seed % 500_000),
          diasSemComprar: 91 + (seed % 200),
        };
      }),
      emQueda: emQuedaCandidatas.map((agencia, indice) => {
        const seed = hashParaNumero(agencia.id + "queda" + indice);
        const mediaMensal12m = 10_000 + (seed % 200_000);
        const quedaPct = 30 + (seed % 50);
        return {
          nome: agencia.nome,
          mediaMensal12m,
          vendasAtual: Math.round(mediaMensal12m * (1 - quedaPct / 100)),
          quedaPct,
        };
      }),
    },
  };
}
