import type { NovasAgenciasData } from "@/modules/novas-agencias/types/novas-agencias.types";

// Serviço 100% mock (sem I/O, sem API real) — SPEC "Análise de Novas
// Agências" recebida em 2026-08-21 pediu reprodução pixel-perfect: os
// valores abaixo são literais, copiados da SPEC seção 9 ("Não arredondar,
// não 'melhorar'"). Nenhum destes nomes, números ou empresas correspondem
// a dado real da Sakura. Mesmo padrão dos demais módulos majoritariamente
// mock deste projeto (ver dashboard-vendas/services/dashboard-vendas.mock-service.ts).

// [nome, meta, executivo, gerente, entrada, primeiraCompra, volume, situacao]
// — as colunas dias/ultima/bilhetes/credito/creditoNota/pagamento do
// array de origem da SPEC (9.2) não são exibidas em lugar nenhum da tela;
// omitidas aqui de propósito.
const LINHAS: [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  "nunca" | "logou" | "comprando" | "parou",
][] = [
  [
    "BRISA VIAGENS",
    "10.000.000/0001-10 · ERP 40000 · São Paulo/SP",
    "Marina Costa",
    "Rafael Andrade",
    "16/08/2026",
    "—",
    "R$ 0,00",
    "nunca",
  ],
  [
    "CAMINHO REAL TURISMO",
    "10.137.913/0001-11 · ERP 40017 · Rio de Janeiro/RJ",
    "Diego Almeida",
    "Rafael Andrade",
    "13/08/2026",
    "—",
    "R$ 0,00",
    "nunca",
  ],
  [
    "ESTRELA DO SUL VIAGENS",
    "10.275.826/0001-12 · ERP 40034 · Belo Horizonte/MG",
    "Juliana Ferreira",
    "Patrícia Lima",
    "10/08/2026",
    "—",
    "R$ 0,00",
    "nunca",
  ],
  [
    "NOVA ROTA TURISMO",
    "10.413.739/0001-13 · ERP 40051 · Curitiba/PR",
    "Thiago Souza",
    "Patrícia Lima",
    "07/08/2026",
    "12/08/2026",
    "R$ 15.300,00",
    "comprando",
  ],
  [
    "PONTO CERTO VIAGENS",
    "10.551.652/0001-14 · ERP 40068 · Porto Alegre/RS",
    "Camila Rocha",
    "Eduardo Martins",
    "04/08/2026",
    "—",
    "R$ 0,00",
    "logou",
  ],
  [
    "MAR AZUL TURISMO",
    "10.689.565/0001-15 · ERP 40085 · Salvador/BA",
    "Bruno Cardoso",
    "Eduardo Martins",
    "01/08/2026",
    "08/08/2026",
    "R$ 27.300,00",
    "comprando",
  ],
  [
    "VIAJE BEM AGENCIA",
    "10.827.478/0001-16 · ERP 40102 · Recife/PE",
    "Marina Costa",
    "Rafael Andrade",
    "29/07/2026",
    "—",
    "R$ 0,00",
    "nunca",
  ],
  [
    "TREVO DE OURO VIAGENS",
    "10.965.391/0001-17 · ERP 40119 · Fortaleza/CE",
    "Diego Almeida",
    "Rafael Andrade",
    "26/07/2026",
    "29/07/2026",
    "R$ 16.200,00",
    "parou",
  ],
  [
    "CONEXAO TOTAL TURISMO",
    "11.103.304/0001-18 · ERP 40136 · Goiânia/GO",
    "Juliana Ferreira",
    "Patrícia Lima",
    "23/07/2026",
    "—",
    "R$ 0,00",
    "nunca",
  ],
  [
    "BOM DESTINO VIAGENS",
    "11.241.217/0001-19 · ERP 40153 · Campinas/SP",
    "Thiago Souza",
    "Patrícia Lima",
    "20/07/2026",
    "—",
    "R$ 0,00",
    "nunca",
  ],
  [
    "SERRA VERDE TURISMO",
    "11.379.130/0001-20 · ERP 40170 · São Paulo/SP",
    "Camila Rocha",
    "Eduardo Martins",
    "17/07/2026",
    "—",
    "R$ 0,00",
    "nunca",
  ],
  [
    "ALVORADA VIAGENS",
    "11.517.043/0001-21 · ERP 40187 · Rio de Janeiro/RJ",
    "Bruno Cardoso",
    "Eduardo Martins",
    "14/07/2026",
    "21/07/2026",
    "R$ 45.240,00",
    "comprando",
  ],
];

// Ids reais das 12 primeiras agências do Postgres local (tabela `agencias`,
// cuid do Prisma) — usados só como destino do link de cada linha mock,
// pra clicar não cair em 404 (antes: ids inventados `nova-agencia-N`, que
// nunca existem em banco nenhum). Nome/CNPJ/dados da linha continuam 100%
// mock da SPEC; o id não aparece em lugar nenhum da UI, só decide pra onde
// o link `/crm/agencias/[id]` aponta. Pontual pro ambiente local — ids vão
// mudar se o banco for resetado (rodar `bun db:seed` de novo).
const IDS_REAIS_LOCAIS = [
  "cmrp2jpyk000kmd9l6ec4nvyc",
  "cmrp2kize000smd9lpli94wto",
  "cmrp390b20016md9l8cmii00g",
  "cmrrzzoe20001ggsul90q088e",
  "cmrs1iuzh0001t5zl4z320j47",
  "cmrs7nwss000ct5zl3flwvusm",
  "cmrs7rrj9000kt5zl6b3qcdt2",
  "cmrs8elkz000vt5zlvw5oqf5e",
  "cmruovdqt0000z6djgbpnoihk",
  "cmrxwdnrl0002tndjbd532i44",
  "cmrxwdnqs0000tndjjsmadgbq",
  "cmrxwdnri0001tndjeioohptq",
];

export const novasAgenciasMockService = {
  async obterNovasAgencias(): Promise<NovasAgenciasData> {
    return {
      sincronizacao: {
        ultimaEm: "14/08/2026",
        distancia: "há 7 dias",
        proximaEm: "22/08/2026",
      },
      funil: {
        novasAgencias: 1_224,
        novasAgenciasPct: "100% da base",
        nuncaCompraram: 963,
        nuncaCompraramPct: "78,7% da base",
        comprando: 261,
        comprandoPct: "21,3% da base",
        baseAprovadas: 1_224,
      },
      volumeGerado: "R$ 26,5 M",
      tempoMedioPrimeiraCompraDias: 15,
      totalAgencias: 28,
      agencias: LINHAS.map(
        ([nome, meta, executivo, gerente, entrada, primeiraCompra, volume, situacao], indice) => ({
          id: IDS_REAIS_LOCAIS[indice] ?? `nova-agencia-${indice + 1}`,
          nome,
          meta,
          executivo,
          gerente,
          entrada,
          primeiraCompra,
          volume,
          situacao,
        }),
      ),
    };
  },
};
