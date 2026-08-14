import type {
  AcuraciaProjecao,
  AgenciaCruzamentoDetalhe,
  AgenciaRecenciaDetalhe,
  BucketIntraday,
  Canal,
  ChaveCruzamento,
  ChaveRecencia,
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
    // soAereo/soTerrestre/ambos de compraram30d conferidos contra o print
    // de referência do modal "Compraram (30d)" (chips Aéreo 1.279 /
    // Terrestre 47 / Ambos 1.050) — corrigido do valor estimado anterior.
    compraram30d: { total: 2_376, soAereo: 1_279, soTerrestre: 47, ambos: 1_050 },
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

const NOMES_AGENCIAS_DETALHE = [
  "DANIELA CRISTINA DE OLIVEIRA ZILIO",
  "GUARATUR",
  "MAIORCA TURISMO",
  "RF TURISMO",
  "GAZIN VIAGENS",
  "LURBOL AGENCIA D",
  "FLASH TEC",
  "DECOLAR.COM",
  "DUCATO TURISMO",
  "ULTRATRAVEL",
  "VAI DE PROMO",
  "SIDNEY ALVES TUR",
  "CH TUR AGENCIA",
  "TRAVEL CORP",
  "RP TURISMO",
  "KALINA VIAGENS",
  "BOREAL TURISMO",
  "ANDROMEDA VIAGENS",
  "PORTAL DO TURISMO",
  "CONFIANÇA TUR",
  "VOA MAIS VIAGENS",
  "TERRA NOVA TURISMO",
  "AZUL MARINHO VIAGENS",
  "CAMINHOS TUR",
  "ROTA CERTA VIAGENS",
  "BRISA TUR",
  "SOL NASCENTE VIAGENS",
  "PONTA DE PRAIA TUR",
  "MONTANHA AZUL VIAGENS",
  "VALE DO SOL TURISMO",
];
const FILIAIS_DETALHE = [
  "SAO",
  "BHZ",
  "CWB",
  "POA",
  "BSB",
  "REC",
  "SSA",
  "FOR",
  "CGH",
  "GIG",
  "CNF",
  "VIX",
  "GYN",
  "MAO",
  "BEL",
];
const EXECUTIVOS_DETALHE = [
  "NARA DANTAS",
  "MARCELO FELIX",
  "SEKAI",
  "MARCO OLICHEVIS",
  "JORGE BORGES",
  "FABIANA SANTOS",
  "SAKURA",
  "JADY OLIVEIRA",
  "CONECTA",
  "IVAIR PEREIRA",
  "PAULA FAGUNDES",
  "JONATHAS MENDES",
  "MARCOS BOARATI",
  "RENATA ALVES",
  "THIAGO SOUZA",
];
const GESTORES_DETALHE = [
  "Filipe Gouvêa",
  "Douglas Mendes",
  "Miguel Ramos",
  "Grasiele Carara",
  "Wesley Andrade",
  "Marcos Boarati",
  "Camila Reis",
  "Eduardo Lima",
];

// CNPJ visualmente plausível (não validado, é só fixture de UI) — hash
// multiplicativo determinístico a partir do índice, mesmo padrão de
// "sem Math.random" do resto do arquivo.
function cnpjFicticio(indice: number): string {
  const n = (indice * 2_654_435_761 + 97) % 100_000_000;
  const d = String(10_000_000 + (n % 90_000_000));
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/0001-${String(10 + (indice % 90)).padStart(2, "0")}`;
}

// Embaralha determinística (hash multiplicativo por índice) — evita ficar
// em blocos por canal/faixa na tabela, sem recorrer a `Math.random`.
function embaralhar<T>(itens: T[]): T[] {
  return itens
    .map((item, indice) => ({ item, chave: (indice * 2_654_435_761 + 12_345) % 1_000_000_007 }))
    .sort((a, b) => a.chave - b.chave)
    .map((x) => x.item);
}

interface FaixaDias {
  qtd: number;
  diasMin: number;
  diasMax: number;
}

// Gerador comum aos 4 modais de detalhamento (4.6) — `porCanal` define o
// canal de cada linha (pra bater com os chips de filtro Aéreo/Terrestre/
// Ambos), `faixasDias` define a faixa de "dias desde a última venda"
// (pra bater com o total do card, que pode ser segmentado por canal OU
// por faixa de inatividade — dimensões independentes, por isso embaralha
// cada uma separadamente em vez de gerar as duas juntas).
function construirDetalheAgencias(
  porCanal: { aereo: number; terrestre: number; ambos: number },
  faixasDias: FaixaDias[],
): AgenciaRecenciaDetalhe[] {
  const total = porCanal.aereo + porCanal.terrestre + porCanal.ambos;
  const canaisOrdenados: Canal[] = [
    ...Array<Canal>(porCanal.aereo).fill("aereo"),
    ...Array<Canal>(porCanal.terrestre).fill("terrestre"),
    ...Array<Canal>(porCanal.ambos).fill("ambos"),
  ];
  const faixasOrdenadas = faixasDias.flatMap((faixa) => Array<FaixaDias>(faixa.qtd).fill(faixa));

  const canaisEmbaralhados = embaralhar(canaisOrdenados);
  const faixasEmbaralhadas = embaralhar(faixasOrdenadas);

  return Array.from({ length: total }, (_, indice) => {
    const canal = canaisEmbaralhados[indice]!;
    const faixa = faixasEmbaralhadas[indice]!;
    const dias = faixa.diasMin + ((indice * 37) % (faixa.diasMax - faixa.diasMin + 1));
    const nomeBase = NOMES_AGENCIAS_DETALHE[indice % NOMES_AGENCIAS_DETALHE.length]!;
    const filial = FILIAIS_DETALHE[indice % FILIAIS_DETALHE.length]!;
    // Repetições do pool de nomes (índice ≥ tamanho do pool) ganham o
    // código da filial no nome, igual ao padrão real visto no print
    // ("MAIORCA TURISMO (SAO)") — evita nome duplicado idêntico na tabela.
    const nome = indice >= NOMES_AGENCIAS_DETALHE.length ? `${nomeBase} (${filial})` : nomeBase;
    const valorBase = 50_000 + ((indice * 9_137) % 900_000);
    const aereo365d = canal === "terrestre" ? 0 : valorBase;
    const terrestre365d = canal === "aereo" ? 0 : Math.round(valorBase * 0.15) + 500;
    const dataVenda = new Date(2026, 7, 13 - dias);

    return {
      nome,
      cnpj: cnpjFicticio(indice),
      filial,
      executivo: EXECUTIVOS_DETALHE[indice % EXECUTIVOS_DETALHE.length]!,
      gestor: GESTORES_DETALHE[indice % GESTORES_DETALHE.length]!,
      canal,
      ultimaVenda: `${dataVenda.getDate().toString().padStart(2, "0")}/${(dataVenda.getMonth() + 1).toString().padStart(2, "0")}/${dataVenda.getFullYear()}`,
      dias,
      aereo365d,
      terrestre365d,
    };
  });
}

function construirRecenciaDetalhe(): Record<ChaveRecencia, AgenciaRecenciaDetalhe[]> {
  return {
    compraram30d: construirDetalheAgencias({ aereo: 1_279, terrestre: 47, ambos: 1_050 }, [
      { qtd: 2_376, diasMin: 1, diasMax: 30 },
    ]),
    compraramAno: construirDetalheAgencias({ aereo: 3_102, terrestre: 298, ambos: 658 }, [
      { qtd: 4_058, diasMin: 1, diasMax: 225 },
    ]),
    // Card é segmentado por faixa de inatividade, não por canal — a spec
    // não dá o breakdown por canal deste card, então assume a mesma
    // proporção aéreo/terrestre/ambos observada em compraram30d (única
    // com número real conferido), escalada pro total de 1.682.
    semVendas30dMais: construirDetalheAgencias({ aereo: 905, terrestre: 33, ambos: 744 }, [
      { qtd: 612, diasMin: 31, diasMax: 89 },
      { qtd: 504, diasMin: 90, diasMax: 179 },
      { qtd: 566, diasMin: 180, diasMax: 365 },
    ]),
    semVendasAno: construirDetalheAgencias({ aereo: 2, terrestre: 1, ambos: 1 }, [
      { qtd: 4, diasMin: 230, diasMax: 420 },
    ]),
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
  // Sufixo do ano dinâmico (ver anoAtual()) — só o RÓTULO acompanha o
  // ano corrente; os valores por mês (Jan→Ago) continuam fixos, a
  // fixture não representa o ano corrente de verdade.
  const sufixoAno = String(new Date().getFullYear()).slice(-2);
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago"].map(
    (mes) => `${mes}/${sufixoAno}`,
  );
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

// Tamanho do ranking completo (modal com scroll infinito, 4.10) — o
// card mostra só os 10 primeiros (`.slice(0, 10)`), o modal usa a lista
// inteira, sempre nesta mesma ordem (nunca reordena).
const TAMANHO_RANKING_AGENCIAS = 300;
const CANAIS_CICLO_CAUDA: Canal[] = [
  "aereo",
  "ambos",
  "aereo",
  "terrestre",
  "aereo",
  "ambos",
  "aereo",
  "aereo",
];

function construirTopAgencias(escala: number): TopAgencia[] {
  const pesosTop10 = NOMES_AGENCIAS.map((_, indice) => 1 / (indice + 1) ** 0.75);
  const somaPesosTop10 = pesosTop10.reduce((acc, peso) => acc + peso, 0);
  const valorTotalTop10 = 3_900_000 * escala;
  const valoresTop10 = distribuirPorPesos(valorTotalTop10, pesosTop10);
  const canaisTop10: Canal[] = [
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
  const top10 = NOMES_AGENCIAS.map((nome, indice) => ({
    posicao: indice + 1,
    nome,
    canal: canaisTop10[indice]!,
    valor: valoresTop10[indice]!,
    qtd: Math.round(valoresTop10[indice]! / 1_000),
  }));

  // Continuação da mesma curva de peso (1/posição^0.75) além do Top 10 —
  // `fator` é o mesmo "valor por unidade de peso" do Top 10, então a
  // cauda emenda sem descontinuidade e sem alterar os 10 primeiros já
  // conferidos contra a spec.
  const fator = valorTotalTop10 / somaPesosTop10;
  const cauda = Array.from({ length: TAMANHO_RANKING_AGENCIAS - NOMES_AGENCIAS.length }, (_, i) => {
    const posicao = NOMES_AGENCIAS.length + i + 1;
    const valor = fator / posicao ** 0.75;
    const indiceNome = NOMES_AGENCIAS.length + i;
    const nomeBase = NOMES_AGENCIAS_DETALHE[indiceNome % NOMES_AGENCIAS_DETALHE.length]!;
    const filial = FILIAIS_DETALHE[indiceNome % FILIAIS_DETALHE.length]!;
    const nome = indiceNome >= NOMES_AGENCIAS_DETALHE.length ? `${nomeBase} (${filial})` : nomeBase;
    return {
      posicao,
      nome,
      canal: CANAIS_CICLO_CAUDA[i % CANAIS_CICLO_CAUDA.length]!,
      valor,
      qtd: Math.round(valor / 1_000),
    };
  });

  return [...top10, ...cauda];
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

// Companhias reais além do Top 10 — mesma lógica do ranking de agências:
// cauda decrescente pela mesma curva de peso, sem alterar os 10 primeiros.
const FORNECEDORES_EXTRA = [
  "COPA AIRLINES",
  "AEROMEXICO",
  "IBERIA",
  "LUFTHANSA",
  "AIR EUROPA",
  "AVIANCA",
  "JETBLUE",
  "DELTA AIR LINES",
  "UNITED AIRLINES",
  "QATAR AIRWAYS",
  "SWISS",
  "KLM",
  "AIR CANADA",
  "ETIHAD AIRWAYS",
  "SAS",
  "FINNAIR",
  "AUSTRIAN AIRLINES",
  "LOT POLISH AIRLINES",
  "VIRGIN ATLANTIC",
  "AEROLINEAS ARGENTINAS",
  "SKY AIRLINE",
  "JETSMART",
  "PASSAREDO",
  "MAP LINHAS AÉREAS",
  "VOEPASS",
  "TOTAL LINHAS AÉREAS",
  "AZUL CARGO",
  "SINGAPORE AIRLINES",
  "CATHAY PACIFIC",
  "AIR CHINA",
];

function construirTopFornecedores(escala: number): TopFornecedor[] {
  const pesosTop10 = FORNECEDORES.map((_, indice) => 1 / (indice + 1) ** 0.65);
  const somaPesosTop10 = pesosTop10.reduce((acc, peso) => acc + peso, 0);
  const valorTotalTop10 = 62_000_000 * escala;
  const bilhetesTotalTop10 = 38_500 * escala;
  const valoresTop10 = distribuirPorPesos(valorTotalTop10, pesosTop10);
  const bilhetesTop10 = distribuirPorPesos(bilhetesTotalTop10, pesosTop10);

  const top10 = FORNECEDORES.map((nome, indice) => ({
    nome,
    qtdBilhetes: bilhetesTop10[indice]!,
    valor: valoresTop10[indice]!,
    participacaoPct: (pesosTop10[indice]! / somaPesosTop10) * 100,
  }));

  // Mesmo "valor/bilhetes por unidade de peso" do Top 10 — a cauda
  // continua a curva sem descontinuidade na posição 11.
  const fatorValor = valorTotalTop10 / somaPesosTop10;
  const fatorBilhetes = bilhetesTotalTop10 / somaPesosTop10;
  const cauda = FORNECEDORES_EXTRA.map((nome, i) => {
    const posicao = FORNECEDORES.length + i + 1;
    const peso = 1 / posicao ** 0.65;
    const valor = fatorValor * peso;
    return {
      nome,
      qtdBilhetes: Math.round(fatorBilhetes * peso),
      valor,
      participacaoPct: (peso / somaPesosTop10) * 100,
    };
  });

  return [...top10, ...cauda];
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

// Teto de linhas geradas por categoria — "Nenhum canal" tem 12.581
// agências reais, mas gerar 12.581 objetos só pra uma lista de UI mock
// não tem propósito; o modal mostra o total real no cabeçalho e carrega
// até este teto via scroll infinito (mesmo padrão de rankingPorMes).
const TETO_LISTA_CRUZAMENTO = 400;

function formatarDataCruzamento(data: Date): string {
  return `${data.getDate().toString().padStart(2, "0")}/${(data.getMonth() + 1).toString().padStart(2, "0")}/${data.getFullYear()}`;
}

function construirLinhaCruzamento(
  indice: number,
  categoria: ChaveCruzamento,
): AgenciaCruzamentoDetalhe {
  const nomeBase = NOMES_AGENCIAS_DETALHE[indice % NOMES_AGENCIAS_DETALHE.length]!;
  const filial = FILIAIS_DETALHE[indice % FILIAIS_DETALHE.length]!;
  const nome = indice >= NOMES_AGENCIAS_DETALHE.length ? `${nomeBase} (${filial})` : nomeBase;
  const valorBase = 40_000 + ((indice * 7_919) % 1_800_000);

  const temAereo = categoria === "ambos" || categoria === "soAereo";
  const temTerrestre = categoria === "ambos" || categoria === "soTerrestre";
  const dataAereo = new Date(2026, 7, 13 - (1 + ((indice * 13) % 40)));
  const dataTerrestre = new Date(2026, 7, 13 - (1 + ((indice * 29) % 90)));

  return {
    nome,
    // Offset no índice do hash só pra não colidir com os CNPJs já usados
    // em construirDetalheAgencias (fixture diferente, mesma origem).
    cnpj: cnpjFicticio(indice + 100_000),
    base: filial,
    executivo: EXECUTIVOS_DETALHE[indice % EXECUTIVOS_DETALHE.length]!,
    bilhetesAereo: temAereo ? 5 + (indice % 120) : 0,
    aereo365d: temAereo ? valorBase : 0,
    vendasTerrestre: temTerrestre ? 1 + (indice % 90) : 0,
    terrestre365d: temTerrestre ? Math.round(valorBase * 0.18) + 300 : 0,
    ultimaAereo: temAereo ? formatarDataCruzamento(dataAereo) : null,
    ultimaTerrestre: temTerrestre ? formatarDataCruzamento(dataTerrestre) : null,
  };
}

function construirCruzamentoDetalhe(
  cruzamento: CruzamentoCanais,
): Record<ChaveCruzamento, AgenciaCruzamentoDetalhe[]> {
  const gerar = (categoria: ChaveCruzamento, total: number) =>
    Array.from({ length: Math.min(total, TETO_LISTA_CRUZAMENTO) }, (_, indice) =>
      construirLinhaCruzamento(indice, categoria),
    );

  return {
    ambos: gerar("ambos", cruzamento.ambos.qtd),
    soAereo: gerar("soAereo", cruzamento.soAereo.qtd),
    soTerrestre: gerar("soTerrestre", cruzamento.soTerrestre.qtd),
    nenhum: gerar("nenhum", cruzamento.nenhum.qtd),
  };
}

async function obterDashboardMock(): Promise<DashboardVendasData> {
  const cruzamentoCanais = construirCruzamentoCanais();

  return {
    resumoPorPeriodo: construirResumoPorPeriodo(),
    miniKpis: { clientesDistintos: 29, bilhetesAereo: 158, ticketMedioAereo: 1_786.5 },
    intraday: construirIntraday(),
    projecao: construirProjecao(),
    acuracia: construirAcuracia(),
    recencia: construirRecencia(),
    recenciaDetalhe: construirRecenciaDetalhe(),
    conversao: construirConversao(),
    vendasMensais: construirVendasMensais(),
    vendasDiarias: construirVendasDiarias(),
    rankingPorMes: { mes: construirTopAgencias(1), ano: construirTopAgencias(11.4) },
    fornecedoresPorMes: { mes: construirTopFornecedores(1), ano: construirTopFornecedores(11.4) },
    nacionalInternacionalPorMes: {
      mes: construirNacionalInternacional(1),
      ano: construirNacionalInternacional(11.4),
    },
    cruzamentoCanais,
    cruzamentoDetalhe: construirCruzamentoDetalhe(cruzamentoCanais),
  };
}

// Métodos granulares (além de `obterDashboard`) pra combinar com o
// carregamento progressivo do lado real (ver dashboard-vendas.sst-
// service.ts) — o mock é só computação em memória, então recalcular o
// objeto inteiro a cada método aqui é barato (sem I/O).
export const dashboardVendasMockService = {
  obterDashboard: obterDashboardMock,
  async obterResumoEDia() {
    const dados = await obterDashboardMock();
    return {
      resumoPorPeriodo: dados.resumoPorPeriodo,
      miniKpis: dados.miniKpis,
      rankingPorMes: dados.rankingPorMes,
      fornecedoresPorMes: dados.fornecedoresPorMes,
      nacionalInternacionalPorMes: dados.nacionalInternacionalPorMes,
    };
  },
  async obterVendasMensais() {
    return (await obterDashboardMock()).vendasMensais;
  },
  async obterVendasDiarias() {
    return (await obterDashboardMock()).vendasDiarias;
  },
  async obterConversao() {
    return (await obterDashboardMock()).conversao;
  },
  async obterRecenciaECruzamento() {
    const dados = await obterDashboardMock();
    return {
      recencia: dados.recencia,
      recenciaDetalhe: dados.recenciaDetalhe,
      cruzamentoCanais: dados.cruzamentoCanais,
      cruzamentoDetalhe: dados.cruzamentoDetalhe,
    };
  },
  async obterMockEstatico() {
    const dados = await obterDashboardMock();
    return { intraday: dados.intraday, projecao: dados.projecao, acuracia: dados.acuracia };
  },
};
