import type {
  AcuraciaProjecao,
  BucketIntraday,
  Canal,
  CruzamentoCanais,
  DashboardVendasData,
  NacionalInternacional,
  PeriodoResumo,
  ProjecaoDia,
  RecenciaAgencias,
  ResumoDia,
  TopAgencia,
  TopFornecedor,
  VendaDiaria,
  VendaMensal,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// Única camada que "fala com o externo" (ver princípios de arquitetura) —
// hoje é fixture fixa determinística porque não existe base de vendas
// aéreas/terrestres neste projeto; no dia em que existir uma API real, só
// esta função troca de implementação, o resto do módulo não muda.

// Data fixa da fixture — corresponde ao exemplo "Atualizado em 13/08 às
// 09:52" da spec. Não usar `new Date()` teria o mesmo efeito (fixture
// determinística), mas fixar o literal deixa explícito que é o cenário
// documentado, não "agora".
const ATUALIZADO_EM = new Date(2026, 7, 13, 9, 52);

// Distribui um total em N pontos seguindo pesos fixos (não aleatórios) —
// normaliza os pesos e ajusta o último ponto pra fechar a soma exata,
// evitando erro de arredondamento acumulado.
function distribuirPorPesos(total: number, pesos: number[]): number[] {
  const somaPesos = pesos.reduce((acc, peso) => acc + peso, 0);
  const valores = pesos.map((peso) => Math.round((total * peso) / somaPesos));
  const diferenca = total - valores.reduce((acc, valor) => acc + valor, 0);
  valores[valores.length - 1] = (valores[valores.length - 1] ?? 0) + diferenca;
  return valores;
}

// Onda determinística (soma de senos com fase fixa) usada só pra gerar
// séries de exemplo com variação "orgânica" sem recorrer a `Math.random`
// — mesma fixture sempre, em qualquer carregamento.
function onda(indice: number, baseline: number, amplitude: number, tendencia = 0): number {
  const variacao =
    Math.sin(indice * 0.9) * 0.6 + Math.sin(indice * 2.3) * 0.3 + Math.sin(indice * 0.35) * 0.4;
  return baseline * (1 + tendencia * indice) + variacao * amplitude;
}

function horariosIntraday(): string[] {
  const horarios: string[] = [];
  for (let minutos = 5 * 60 + 45; minutos <= 9 * 60 + 45; minutos += 15) {
    const h = Math.floor(minutos / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutos % 60).toString().padStart(2, "0");
    horarios.push(`${h}:${m}`);
  }
  return horarios;
}

function construirIntraday(): BucketIntraday[] {
  const horarios = horariosIntraday();
  const pesos = horarios.map((_, indice) => Math.max(0.2, onda(indice, 1, 0.55, 0.03)));

  const valoresNacional = distribuirPorPesos(195_000, pesos);
  const valoresInternacional = distribuirPorPesos(87_267.49, pesos);
  const qtdNacional = distribuirPorPesos(130, pesos);
  const qtdInternacional = distribuirPorPesos(28, pesos);

  return horarios.map((horario, indice) => ({
    horario,
    nacional: { valor: valoresNacional[indice]!, qtd: qtdNacional[indice]! },
    internacional: { valor: valoresInternacional[indice]!, qtd: qtdInternacional[indice]! },
    terrestre: { valor: 0, qtd: 0 },
  }));
}

function construirResumoPorPeriodo(): Record<PeriodoResumo, ResumoDia> {
  const base: Record<
    PeriodoResumo,
    { atualizadoEm: Date; aereo: [number, number, number]; terrestre: [number, number, number] }
  > = {
    // valor, quantidade, margemPct — participação é derivada no adapter.
    hoje: { atualizadoEm: ATUALIZADO_EM, aereo: [282_267.49, 158, 4.1], terrestre: [0, 0, 0] },
    ontem: {
      atualizadoEm: new Date(2026, 7, 12, 23, 59),
      aereo: [195_430.2, 121, 3.8],
      terrestre: [3_200, 4, 14.2],
    },
    mes: {
      atualizadoEm: ATUALIZADO_EM,
      aereo: [2_847_500.32, 1_840, 4.3],
      terrestre: [42_300, 28, 15.6],
    },
    ano: {
      atualizadoEm: ATUALIZADO_EM,
      aereo: [1_320_800_000, 742_300, 4.2],
      terrestre: [26_700_000, 9_840, 15.1],
    },
  };

  const periodos = Object.keys(base) as PeriodoResumo[];
  const resultado = {} as Record<PeriodoResumo, ResumoDia>;
  for (const periodo of periodos) {
    const item = base[periodo];
    resultado[periodo] = {
      atualizadoEm: item.atualizadoEm,
      aereo: {
        valor: item.aereo[0],
        quantidade: item.aereo[1],
        participacaoPct: 0,
        margemPct: item.aereo[2],
      },
      terrestre: {
        valor: item.terrestre[0],
        quantidade: item.terrestre[1],
        participacaoPct: 0,
        margemPct: item.terrestre[2],
      },
    };
  }
  return resultado;
}

function construirProjecao(): ProjecaoDia {
  const fechamentoEsperado = 8_100_000;
  const realizadoNacional = 195_000;
  const realizadoInternacional = 87_267.49;
  const realizado = realizadoNacional + realizadoInternacional;
  const shareNacional = realizadoNacional / realizado;

  const horas = Array.from({ length: 22 }, (_, indice) => indice); // 00:00 → 21:00
  const horaAtual = 9;
  const curva = horas.map((hora) => {
    const esperado = distribuirPorPesos(
      fechamentoEsperado,
      horas.map((h) => Math.max(0.1, onda(h, 1, 0.4, 0.02))),
    )[hora]!;
    const acumuladoEsperado = horas
      .slice(0, hora + 1)
      .reduce((acc, h, i) => acc + (i === hora ? esperado : 0), esperado);
    return {
      hora: `${hora.toString().padStart(2, "0")}:00`,
      esperado: acumuladoEsperado,
      nacionalHoje:
        hora <= horaAtual ? Math.round(realizadoNacional * ((hora + 1) / (horaAtual + 1))) : null,
      internacionalHoje:
        hora <= horaAtual
          ? Math.round(realizadoInternacional * ((hora + 1) / (horaAtual + 1)))
          : null,
    };
  });

  // Curva acumulada real (não só o bucket da hora) — corrige o esperado
  // pra ser sempre crescente, como uma projeção de fechamento do dia.
  let acumulado = 0;
  const curvaAcumulada = curva.map((ponto) => {
    acumulado += ponto.esperado;
    return { ...ponto, esperado: Math.min(acumulado, fechamentoEsperado) };
  });

  return {
    atualizadoEm: ATUALIZADO_EM,
    percentualDiaTranscorrido: ((9 * 60 + 52) / (24 * 60)) * 100,
    fechamentoEsperado,
    faixaMin: 7_600_000,
    faixaMax: 8_700_000,
    realizado,
    aEmitir: fechamentoEsperado - realizado,
    nacional: {
      projecao: Math.round(fechamentoEsperado * shareNacional),
      realizado: realizadoNacional,
    },
    internacional: {
      projecao: Math.round(fechamentoEsperado * (1 - shareNacional)),
      realizado: realizadoInternacional,
    },
    curva: curvaAcumulada,
  };
}

function construirAcuracia(): AcuraciaProjecao {
  const historico = Array.from({ length: 30 }, (_, indice) => {
    const dia = new Date(2026, 6, 14 + indice); // 14/07 → 12/08 (30 dias fechados antes de hoje)
    const previsto = Math.round(onda(indice, 7_200_000, 900_000, 0.01));
    const real = Math.round(previsto * (1 + Math.sin(indice * 1.7) * 0.004));
    return {
      dia: `${dia.getDate().toString().padStart(2, "0")}/${(dia.getMonth() + 1).toString().padStart(2, "0")}`,
      previsto,
      real,
    };
  });
  return { erroMedioPct: 0.4, historico };
}

function construirRecencia(): RecenciaAgencias {
  return {
    compraram30d: { total: 2_376, soAereo: 1_920, soTerrestre: 134, ambos: 322 },
    compraramAno: { total: 4_058, soAereo: 3_102, soTerrestre: 298, ambos: 658 },
    semVendas30dMais: { total: 1_682, faixa31a89: 612, faixa90a179: 504, faixa180Mais: 566 },
    semVendasAno: {
      total: 4,
      soAereo: 2,
      soTerrestre: 1,
      ambos: 1,
      compraramAnoAnterior: 612,
      compraramAnoAtual: 4_058,
      soAnoAnterior: 58,
    },
  };
}

function construirConversao(): DashboardVendasData["conversao"] {
  const periodoComparativo = "1–12 jul vs 1–12 ago";
  const aereoMes = { valor: 91_200_456, bilhetes: 51_040 };
  const terrestreMes = { valor: 1_200_576, vendas: 442 };
  const porCanal: Record<
    Canal,
    { saude: number; volume: number; bilhetesVendas: number; agencias: number }
  > = {
    ambos: { saude: 32.9, volume: 60.1, bilhetesVendas: 23.5, agencias: 46.6 },
    aereo: { saude: 34.1, volume: 58.3, bilhetesVendas: 24.8, agencias: 44.2 },
    terrestre: { saude: 18.7, volume: 12.4, bilhetesVendas: 9.1, agencias: 15.3 },
  };
  const canais = Object.keys(porCanal) as Canal[];
  const resultado = {} as DashboardVendasData["conversao"];
  for (const canal of canais) {
    const item = porCanal[canal];
    resultado[canal] = {
      saudePct: item.saude,
      volumeMesVarPct: item.volume,
      bilhetesVendasMesVarPct: item.bilhetesVendas,
      agenciasMesVarPct: item.agencias,
      periodoComparativo,
      aereoMes,
      terrestreMes,
    };
  }
  return resultado;
}

function construirVendasMensais(): VendaMensal[] {
  const meses = ["Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26", "Jul/26", "Ago/26"];
  const pesosCrescimento = meses.map((_, indice) => Math.max(0.4, onda(indice, 1, 0.25, 0.09)));

  const nacional = distribuirPorPesos(423_500_000, pesosCrescimento);
  const internacional = distribuirPorPesos(897_300_000, pesosCrescimento);
  const terrestre = distribuirPorPesos(26_700_000, pesosCrescimento);

  return meses.map((mes, indice) => ({
    mes,
    aereoNacional: nacional[indice]!,
    aereoInternacional: internacional[indice]!,
    terrestre: terrestre[indice]!,
  }));
}

function construirVendasDiarias(): VendaDiaria[] {
  return Array.from({ length: 30 }, (_, indice) => {
    const dia = new Date(2026, 6, 15 + indice); // 15/07 → 13/08
    const total = onda(indice, 7_000_000, 4_200_000, 0.006);
    const aereo = total * 0.93;
    const terrestre = total * 0.07;
    return {
      data: `${dia.getDate().toString().padStart(2, "0")}/${(dia.getMonth() + 1).toString().padStart(2, "0")}`,
      aereo: Math.max(500_000, Math.round(aereo)),
      terrestre: Math.max(20_000, Math.round(terrestre)),
    };
  });
}

const NOMES_AGENCIAS = [
  "Viação Andorinha Turismo",
  "Passaggio Viagens",
  "Cometa Tour Operadora",
  "Trilhas do Sul Turismo",
  "Bella Rota Consolidadora",
  "Horizonte Azul Viagens",
  "Costa Norte Turismo",
  "Nômade Travel Club",
  "Latitude 21 Viagens",
  "Estrela Guia Turismo",
];

function construirTopAgencias(escala: number): TopAgencia[] {
  const pesos = NOMES_AGENCIAS.map((_, indice) => 1 / (indice + 1) ** 0.75);
  const valores = distribuirPorPesos(3_900_000 * escala, pesos);
  const canais: Canal[] = [
    "aereo",
    "aereo",
    "ambos",
    "aereo",
    "terrestre",
    "aereo",
    "ambos",
    "aereo",
    "aereo",
    "ambos",
  ];
  // Ticket médio ~R$1.000 — calibrado pra bater com o exemplo da spec
  // (agência #1: "R$ 3,9M" / "3.899" bilhetes/vendas).
  return NOMES_AGENCIAS.map((nome, indice) => ({
    posicao: indice + 1,
    nome,
    canal: canais[indice]!,
    valor: valores[indice]!,
    qtd: Math.round(valores[indice]! / 1_000),
  }));
}

const FORNECEDORES = [
  "LATAM",
  "AZUL",
  "GOL",
  "TAP",
  "EMIRATES",
  "AIR FRANCE",
  "AMERICAN AIRLINES",
  "TURKISH AIRLINES",
  "BRITISH AIRWAYS",
  "ITA AIRWAYS",
];

function construirTopFornecedores(escala: number): TopFornecedor[] {
  const pesos = FORNECEDORES.map((_, indice) => 1 / (indice + 1) ** 0.65);
  const somaPesos = pesos.reduce((acc, peso) => acc + peso, 0);
  const valorTotal = 62_000_000 * escala;
  const valores = distribuirPorPesos(valorTotal, pesos);
  const bilhetes = distribuirPorPesos(38_500 * escala, pesos);
  return FORNECEDORES.map((nome, indice) => ({
    nome,
    qtdBilhetes: bilhetes[indice]!,
    valor: valores[indice]!,
    participacaoPct: (pesos[indice]! / somaPesos) * 100,
  }));
}

function construirNacionalInternacional(escala: number): NacionalInternacional {
  return {
    nacional: { valor: 22_600_000 * escala, bilhetes: Math.round(15_858 * escala) },
    internacional: { valor: 54_200_000 * escala, bilhetes: Math.round(7_392 * escala) },
  };
}

function construirCruzamentoCanais(): CruzamentoCanais {
  return {
    totalAgenciasCarteira: 16_598,
    ambos: { qtd: 1_430, pct: 0 },
    soAereo: { qtd: 2_418, pct: 0 },
    soTerrestre: { qtd: 169, pct: 0 },
    nenhum: { qtd: 12_581, pct: 0 },
  };
}

export const dashboardVendasMockService = {
  async obterDashboard(): Promise<DashboardVendasData> {
    return {
      resumoPorPeriodo: construirResumoPorPeriodo(),
      miniKpis: { clientesDistintos: 29, bilhetesAereo: 158, ticketMedioAereo: 1_786.5 },
      intraday: construirIntraday(),
      projecao: construirProjecao(),
      acuracia: construirAcuracia(),
      recencia: construirRecencia(),
      conversao: construirConversao(),
      vendasMensais: construirVendasMensais(),
      vendasDiarias: construirVendasDiarias(),
      rankingPorMes: { mes: construirTopAgencias(1), ano: construirTopAgencias(11.4) },
      fornecedoresPorMes: { mes: construirTopFornecedores(1), ano: construirTopFornecedores(11.4) },
      nacionalInternacionalPorMes: {
        mes: construirNacionalInternacional(1),
        ano: construirNacionalInternacional(11.4),
      },
      cruzamentoCanais: construirCruzamentoCanais(),
    };
  },
};
