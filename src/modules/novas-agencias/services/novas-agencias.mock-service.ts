import type {
  AgenciaNova,
  AgenciaParandoDeComprar,
  NovasAgenciasData,
  ResponsavelRanking,
  SituacaoAgencia,
} from "@/modules/novas-agencias/types/novas-agencias.types";

// Serviço 100% mock (sem I/O, sem API real) — SPEC "Análise de Novas
// Agências" pediu reprodução fiel só do front-end; nenhum destes nomes,
// números ou empresas correspondem a dado real da Sakura. Mesmo padrão
// dos demais módulos majoritariamente mock deste projeto (ver
// dashboard-vendas/services/dashboard-vendas.mock-service.ts).

const NOMES_AGENCIA = [
  "BRISA VIAGENS",
  "CAMINHO REAL TURISMO",
  "ESTRELA DO SUL VIAGENS",
  "NOVA ROTA TURISMO",
  "PONTO CERTO VIAGENS",
  "MAR AZUL TURISMO",
  "VIAJE BEM AGENCIA",
  "TREVO DE OURO VIAGENS",
  "CONEXAO TOTAL TURISMO",
  "BOM DESTINO VIAGENS",
  "SERRA VERDE TURISMO",
  "ALVORADA VIAGENS",
  "PASSAGEM LIVRE TURISMO",
  "HORIZONTE AZUL VIAGENS",
  "CENTRAL DO TURISMO",
  "VOA FACIL VIAGENS",
  "RAIZ TURISMO",
  "PRIMA VIAGENS E TURISMO",
  "ATLAS TURISMO",
  "BUSSOLA VIAGENS",
  "GIRASSOL TURISMO",
  "ORLA VIAGENS",
  "NORTE SUL TURISMO",
  "COMETA VIAGENS",
  "FAROL TURISMO",
  "ANCORA VIAGENS",
  "PONTA FINA TURISMO",
  "DESTINO CERTO VIAGENS",
] as const;

const CIDADES: { cidade: string; uf: string }[] = [
  { cidade: "São Paulo", uf: "SP" },
  { cidade: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Belo Horizonte", uf: "MG" },
  { cidade: "Curitiba", uf: "PR" },
  { cidade: "Porto Alegre", uf: "RS" },
  { cidade: "Salvador", uf: "BA" },
  { cidade: "Recife", uf: "PE" },
  { cidade: "Fortaleza", uf: "CE" },
  { cidade: "Goiânia", uf: "GO" },
  { cidade: "Campinas", uf: "SP" },
];

const RESPONSAVEIS = [
  { executivo: "Marina Costa", gerente: "Rafael Andrade" },
  { executivo: "Diego Almeida", gerente: "Rafael Andrade" },
  { executivo: "Juliana Ferreira", gerente: "Patrícia Lima" },
  { executivo: "Thiago Souza", gerente: "Patrícia Lima" },
  { executivo: "Camila Rocha", gerente: "Eduardo Martins" },
  { executivo: "Bruno Cardoso", gerente: "Eduardo Martins" },
];

function diaAtras(referencia: Date, dias: number): Date {
  const data = new Date(referencia);
  data.setDate(data.getDate() - dias);
  return data;
}

function cnpjFicticio(indice: number): string {
  const base = (10_000_000 + indice * 137_913).toString().padStart(8, "0");
  return `${base.slice(0, 2)}.${base.slice(2, 5)}.${base.slice(5, 8)}/0001-${(indice % 89) + 10}`;
}

const SITUACOES_CICLO: SituacaoAgencia[] = [
  "nunca_comprou",
  "nunca_comprou",
  "nunca_comprou",
  "comprando",
  "logou_nunca_comprou",
  "comprando",
  "nunca_comprou",
  "parou_comprar",
];

function construirAgencias(referencia: Date): AgenciaNova[] {
  return NOMES_AGENCIA.map((nome, indice) => {
    const { cidade, uf } = CIDADES[indice % CIDADES.length]!;
    const { executivo, gerente } = RESPONSAVEIS[indice % RESPONSAVEIS.length]!;
    const situacao = SITUACOES_CICLO[indice % SITUACOES_CICLO.length]!;
    const entrada = diaAtras(referencia, 5 + indice * 3);

    const comprou = situacao === "comprando" || situacao === "parou_comprar";
    const primeiraCompra = comprou ? diaAtras(entrada, -(2 + (indice % 6))) : null;
    const diasAtePrimeiraCompra = comprou ? 2 + (indice % 6) : null;
    const ultimaCompra = comprou
      ? diaAtras(referencia, situacao === "parou_comprar" ? 65 + (indice % 20) : indice % 25)
      : null;
    const bilhetes = comprou ? 2 + (indice % 18) : 0;
    const volumeTotal = comprou ? bilhetes * (1_800 + (indice % 7) * 420) : 0;
    const temCredito = indice % 3 !== 0;
    const creditoValor = temCredito ? 8_000 + (indice % 9) * 3_500 : 0;
    const creditoDetalhe = temCredito
      ? `cartão ${formatarMil(creditoValor * 0.6)}`
      : "sem faturado";

    return {
      id: `nova-agencia-${indice + 1}`,
      nome,
      cnpj: cnpjFicticio(indice),
      erp: `${40000 + indice * 17}`,
      cidade,
      uf,
      executivo,
      gerente,
      entrada,
      primeiraCompra,
      diasAtePrimeiraCompra,
      ultimaCompra,
      bilhetes,
      volumeTotal,
      creditoValor,
      creditoDetalhe,
      formasPagamento: comprou ? (indice % 2 === 0 ? "Cartão agência" : "Faturado") : null,
      situacao,
    };
  });
}

function formatarMil(valor: number): string {
  return `R$ ${(valor / 1000).toFixed(1).replace(".", ",")} mil`;
}

function construirAgenciasParandoDeComprar(referencia: Date): AgenciaParandoDeComprar[] {
  return NOMES_AGENCIA.slice(0, 14).map((nome, indice) => {
    const { cidade, uf } = CIDADES[(indice + 3) % CIDADES.length]!;
    const { executivo, gerente } = RESPONSAVEIS[(indice + 2) % RESPONSAVEIS.length]!;
    const diasSemComprar = 26 + indice * 3;
    const pago30d = indice % 4 === 0 ? 0 : (indice % 6) * 1_450;
    const pago30a60d = 3_200 + (indice % 5) * 980;

    return {
      id: `parando-${indice + 1}`,
      nome,
      cnpj: cnpjFicticio(indice + 100),
      erp: `${50000 + indice * 11}`,
      cidade,
      uf,
      executivo,
      gerente,
      ultimaCompra: diaAtras(referencia, diasSemComprar),
      diasSemComprar,
      pago30d,
      pago30a60d,
      volumeTotal: pago30d + pago30a60d + (indice % 8) * 2_100,
    };
  });
}

function construirRanking(offset: number, quantidade: number): ResponsavelRanking[] {
  const base = Array.from({ length: quantidade }, (_, indice) => {
    const nome =
      RESPONSAVEIS[(indice + offset) % RESPONSAVEIS.length]!.executivo +
      (indice >= RESPONSAVEIS.length ? ` ${Math.floor(indice / RESPONSAVEIS.length) + 1}` : "");
    const novas = 180 - indice * 12;
    const nuncaComprou = Math.round(novas * 0.62);
    const comprando = Math.round(novas * 0.22);
    const logouSemComprar = Math.max(novas - nuncaComprou - comprando, 0);

    return {
      id: `responsavel-${offset}-${indice + 1}`,
      nome,
      novas,
      nuncaComprou,
      logouSemComprar,
      comprando,
      mais15d: Math.max(4 - indice, 0),
      mais30d: Math.max(2 - Math.floor(indice / 2), 0),
      mais60d: indice % 5 === 0 ? 1 : 0,
      conversaoPct: Math.max(8, 34 - indice * 2.4),
      mediaAtePrimeiraCompraDias: indice % 6 === 5 ? null : 6 + (indice % 5),
      volume: comprando * (2_100 + indice * 90),
    };
  }).sort((a, b) => b.novas - a.novas);

  return [
    ...base,
    {
      id: `responsavel-${offset}-sem`,
      nome: "— sem responsável",
      novas: 6,
      nuncaComprou: 5,
      logouSemComprar: 1,
      comprando: 0,
      mais15d: 0,
      mais30d: 0,
      mais60d: 0,
      conversaoPct: 0,
      mediaAtePrimeiraCompraDias: null,
      volume: 0,
    },
  ];
}

export const novasAgenciasMockService = {
  async obterNovasAgencias(): Promise<NovasAgenciasData> {
    const referencia = new Date();

    return {
      kpis: {
        novasAgencias: 1_224,
        nuncaCompraram: 963,
        comprando: 261,
        semComprar15d: 53,
        semComprar30d: 9,
        pararam60d: 1,
        volumeGerado: 26_500_000,
        pagoUltimos30d: 23_400_000,
        variacao30dPct: 678.8,
        tempoMedioPrimeiraCompraDias: 15,
      },
      mixPagamento: [
        { label: "Faturado", valor: 6_300_000, comTooltip: true },
        { label: "Cartão agência", valor: 17_600_000, comTooltip: true },
        { label: "CarteiraClick", valor: 746_600, comTooltip: true },
        { label: "Misto", valor: 68_900, comTooltip: true },
        { label: "Cash", valor: 94_200, comTooltip: true },
        { label: "Outros / não classificado", valor: 1_600_000, comTooltip: true },
      ],
      totalPago: 26_500_000,
      credito: {
        comLimiteFaturado: 555,
        semLimiteFaturado: 669,
        limiteFaturadoTotal: 28_600_000,
      },
      sincronizacao: {
        ultimaEm: diaAtras(referencia, 7),
        proximaEm: diaAtras(referencia, -1),
      },
      agencias: construirAgencias(referencia),
      agenciasParandoDeComprar: construirAgenciasParandoDeComprar(referencia),
      cobrancaPorResponsavel: {
        executivos: construirRanking(0, 12),
        gerentes: construirRanking(3, 6),
      },
    };
  },
};
