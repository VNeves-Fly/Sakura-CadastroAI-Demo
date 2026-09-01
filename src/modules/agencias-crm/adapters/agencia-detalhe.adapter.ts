import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { labelStatus, classesBadgeStatus } from "@/modules/admin/utils/status-cadastro.util";
import { tempoDecorrido } from "@/modules/agencias-crm/utils/tempo-decorrido.util";
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import {
  gerarMargemAereo,
  gerarMargemTerrestre,
  gerarNacIntTerrestre,
  gerarVolumePorPeriodo,
} from "@/modules/agencias-crm/utils/canal-margem-mock.util";
import type { PeriodoVolumeAgencia } from "@/modules/agencias-crm/utils/canal-margem-mock.util";
import { IDENTIDADES_AGENCIAS_MOCK } from "@/modules/crm-mock/agencias.mock-data";
import type {
  AgenciaDetalheView,
  CanalMargem,
  CategoriaPremiacao,
  FaturaAgencia,
  TopCompanhiaAgencia,
  VolumeCanalPeriodoAgencia,
} from "@/modules/agencias-crm/types/agencia-detalhe.types";

const CATEGORIAS: CategoriaPremiacao[] = ["10K", "100K", "1M", "10M"];
const COMPANHIAS_AEREAS = [
  "Azul",
  "Gol",
  "Latam",
  "Boliviana de Aviacion",
  "Iberia",
  "Lufthansa",
  "Air France",
  "Air Europa",
  "Tap Portugal",
  "United Airlines",
];

// "123 Viagens..." -> "AG-123" — mesmo padrão de identificador único mock
// já usado no módulo gestores (ver gerarIdentificador em
// gestor-detalhe.adapter.ts), sem campo real equivalente no model Agencia.
function gerarIdentificador(razaoSocial: string): string {
  const primeiraPalavra =
    razaoSocial
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .split(/\s+/)
      .filter(Boolean)[0] ?? "AGENCIA";
  return `AG-${primeiraPalavra.toUpperCase().slice(0, 12)}`;
}

// "Etapa" do cabeçalho (SPEC 4.4, badge cinza "contrato"/"aprovado"/
// "inativo") — sem campo real equivalente a isso no schema
// (Agencia.etapaAtual é um contador de passo do wizard público, não essa
// taxonomia); derivado do status real por aproximação.
function labelEtapa(status: string): string {
  if (status === "ativo") return "aprovado";
  if (status === "recusado") return "inativo";
  if (status === "em_analise" || status === "em_complementar") return "análise";
  return "contrato";
}

// participacaoPct sobre `totalAereo` (volumeNacional + volumeInternacional
// do bloco vendas, ver construirBlocoVendas), não sobre a soma dos
// volumes mockados aqui (que são hash independente, sem relação com o
// total aéreo mockado em construirBlocoVendas).
function gerarTopCompanhias(base: number, totalAereo: number): TopCompanhiaAgencia[] {
  return COMPANHIAS_AEREAS.map((nome, indice) => {
    const volume = 10_000 + (hashParaNumero(`${base}-${nome}`) % ((10 - indice) * 40_000 + 5_000));
    return {
      nome,
      volume,
      participacaoPct: totalAereo > 0 ? (volume / totalAereo) * 100 : 0,
    };
  }).sort((a, b) => b.volume - a.volume);
}

function gerarFaturas(base: number, quantidade: number): FaturaAgencia[] {
  return Array.from({ length: quantidade }, (_, indice) => {
    const seed = base + indice * 61;
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + (seed % 60) - 30);
    const status: FaturaAgencia["status"] =
      seed % 10 === 0 ? "vencido" : seed % 3 === 0 ? "a_vencer" : "pago";
    const credito = seed % 15 === 0;
    return {
      numero: `#${String(100000 + (seed % 900000))}`,
      vencimento: hoje.toISOString(),
      cias: COMPANHIAS_AEREAS[seed % COMPANHIAS_AEREAS.length]!,
      status,
      valor: credito ? -(500 + (seed % 3_000)) : 500 + (seed % 8_000),
    };
  });
}

// Margem/rentabilidade de um canal — sem fonte real hoje (repositório de
// DEMONSTRAÇÃO, nunca chama o SST): sempre mock determinístico por hash.
// `volumeParaMock` converte o `rentabLYPct` do mock (% do canal) num
// valor absoluto (R$).
function construirMargemCanal(
  base: number,
  gerarMock: (base: number) => {
    margemPct: number;
    margemLYPct: number;
    margemVariacaoPct: number;
    rentabLYPct: number;
    rentabLYVariacaoPct: number;
  },
  volumeParaMock: number,
): CanalMargem {
  const mock = gerarMock(base);
  return {
    margemPct: mock.margemPct,
    margemLYPct: mock.margemLYPct,
    margemVariacaoPct: mock.margemVariacaoPct,
    rentabLYValor: Math.round((volumeParaMock * mock.rentabLYPct) / 100),
    rentabLYVariacaoPct: mock.rentabLYVariacaoPct,
  };
}

// Card "Volume total" por período (dia/ontem/mês/ano) — sem fonte real
// hoje: "Ano" reaproveita os totais anuais já resolvidos por
// construirBlocoVendas (mesmo mock, sem dado divergente); dia/ontem/mês
// vêm de gerarVolumePorPeriodo, com o split Aéreo/Terrestre aplicado via
// a MESMA proporção anual que o card já usava.
function construirPorPeriodo(
  base: number,
  totaisAno: {
    valor: number;
    volumeAereo: number;
    volumeTerrestre: number;
    bilhetesAereo: number;
    ticketMedioAereo: number;
    servicosTerrestre: number;
    ticketMedioTerrestre: number;
  },
): Record<PeriodoVolumeAgencia, VolumeCanalPeriodoAgencia> {
  const participacaoAereoPct =
    totaisAno.valor > 0 ? (totaisAno.volumeAereo / totaisAno.valor) * 100 : 0;
  const mockPorPeriodo = gerarVolumePorPeriodo(base, totaisAno.valor);

  function doValor(valor: number): VolumeCanalPeriodoAgencia {
    const volumeAereo = Math.round((valor * participacaoAereoPct) / 100);
    const volumeTerrestre = valor - volumeAereo;
    return {
      valor,
      volumeAereo,
      volumeTerrestre,
      bilhetesAereo:
        totaisAno.ticketMedioAereo > 0 ? Math.round(volumeAereo / totaisAno.ticketMedioAereo) : 0,
      ticketMedioAereo: totaisAno.ticketMedioAereo,
      servicosTerrestre:
        totaisAno.ticketMedioTerrestre > 0
          ? Math.round(volumeTerrestre / totaisAno.ticketMedioTerrestre)
          : 0,
      ticketMedioTerrestre: totaisAno.ticketMedioTerrestre,
    };
  }

  return {
    dia: doValor(mockPorPeriodo.dia.valor),
    ontem: doValor(mockPorPeriodo.ontem.valor),
    mes: doValor(mockPorPeriodo.mes.valor),
    ano: totaisAno,
  };
}

// Bloco "vendas" + categoria — sem fonte real hoje (repositório de
// DEMONSTRAÇÃO, nunca chama o SST): 100% mock determinístico por hash,
// reaproveitado tanto por `montarAgenciaDetalheViewMock` quanto (via
// seed diferente) por qualquer outra tela que precise do mesmo formato.
function construirBlocoVendas(base: number): Pick<AgenciaDetalheView, "categoria" | "vendas"> & {
  volumeAno: number;
  semVenda: boolean;
  dataUltimaCompra: string | null;
} {
  const semVenda = base % 12 === 0;
  const categoria = semVenda ? null : CATEGORIAS[base % CATEGORIAS.length]!;

  const volumeAno = semVenda ? 0 : ((base % 900) + 30) * 15_000;
  const bilhetesAno = semVenda ? 0 : 30 + (base % 600);
  const volumeNacional = Math.round(volumeAno * 0.55);
  const volumeInternacional = Math.round(volumeAno * 0.4);
  const volumeTerrestre = volumeAno - volumeNacional - volumeInternacional;
  const bilhetesNacional = Math.round(bilhetesAno * 0.72);
  const bilhetesInternacional = bilhetesAno - bilhetesNacional;
  const diasSemComprar = semVenda ? 90 + (base % 300) : base % 400;
  const dataUltimaCompra = semVenda
    ? null
    : new Date(Date.now() - diasSemComprar * 86_400_000).toISOString();

  const servicosTerrestre = Math.round(bilhetesAno * 0.08);

  const margemAereo = construirMargemCanal(
    base,
    gerarMargemAereo,
    volumeNacional + volumeInternacional,
  );
  const margemTerrestre = construirMargemCanal(base, gerarMargemTerrestre, volumeTerrestre);
  const terrestreNacInt = gerarNacIntTerrestre(base);
  const ticketMedioAereo =
    bilhetesAno > 0 ? Math.round((volumeNacional + volumeInternacional) / bilhetesAno) : 0;
  const ticketMedioTerrestre =
    servicosTerrestre > 0 ? Math.round(volumeTerrestre / servicosTerrestre) : 0;
  const porPeriodo = construirPorPeriodo(base, {
    valor: volumeAno,
    volumeAereo: volumeNacional + volumeInternacional,
    volumeTerrestre,
    bilhetesAereo: bilhetesAno,
    ticketMedioAereo,
    servicosTerrestre,
    ticketMedioTerrestre,
  });

  return {
    categoria,
    volumeAno,
    semVenda,
    dataUltimaCompra,
    vendas: {
      aereoNacional: {
        volume: volumeNacional,
        bilhetes: bilhetesNacional,
        pctAereo: bilhetesAno > 0 ? Math.round((bilhetesNacional / bilhetesAno) * 100) : 0,
      },
      aereoInternacional: {
        volume: volumeInternacional,
        bilhetes: bilhetesInternacional,
        pctAereo: bilhetesAno > 0 ? Math.round((bilhetesInternacional / bilhetesAno) * 100) : 0,
      },
      terrestre: {
        volume: volumeTerrestre,
        servicos: servicosTerrestre,
        pctMix: volumeAno > 0 ? Math.round((volumeTerrestre / volumeAno) * 100) : 0,
        nacPct: terrestreNacInt.nacPct,
        intPct: terrestreNacInt.intPct,
      },
      volumeTotalAno: volumeAno,
      ticketMedioAereo,
      topCompanhias: gerarTopCompanhias(base, volumeNacional + volumeInternacional),
      faturas: gerarFaturas(base, semVenda ? 0 : 5 + (base % 15)),
      margemAereo,
      margemTerrestre,
      porPeriodo,
    },
  };
}

// Página de detalhe (/crm/agencias/[id]) — repositório de DEMONSTRAÇÃO:
// nunca chama o SST nem o Postgres local. A identidade (razão social,
// CNPJ, SICA, base, executivo, gestor, status) vem das 25 agências
// fictícias canônicas de crm-mock/agencias.mock-data.ts — mesma fonte da
// listagem (/crm/agencias) e do portfólio de /crm/executivos e
// /crm/gestores, garantindo que o mesmo `id` mostre os mesmos dados em
// qualquer tela. Vendas/margem/top companhias/faturas reaproveitam os
// mesmos geradores determinísticos por hash já usados no restante do
// adapter (`construirBlocoVendas`), com seed = hash do id da agência (não
// do sicaCodigo — aqui os dois são o mesmo mock). `null` de retorno = id
// não encontrado entre as identidades mock (a página trata como 404).
export function montarAgenciaDetalheViewMock(id: string): AgenciaDetalheView | null {
  const identidade = IDENTIDADES_AGENCIAS_MOCK.find((item) => item.id === id);
  if (!identidade) return null;

  const status = identidade.ativo ? "ativo" : "recusado";
  const base = hashParaNumero(identidade.id);
  const blocoVendas = construirBlocoVendas(base);

  return {
    id: identidade.id,
    identificador: gerarIdentificador(identidade.nome),
    categoria: blocoVendas.categoria,
    temRiscoCadastral: false,
    ativoSistema: identidade.ativo,
    ativadoEm: identidade.entradaEm.toISOString(),
    dadosDocumentacao: {
      empresa: {
        nomeFantasia: identidade.nome,
        razaoSocial: identidade.nome,
        cnpj: unmaskCnpj(identidade.cnpj),
        statusLabel: labelStatus(status),
        statusClasses: classesBadgeStatus(status),
        etapaLabel: labelEtapa(status),
        situacaoReceita: identidade.ativo ? "Ativa" : null,
        dataAbertura: null,
        tempoDeCnpj: null,
        capitalSocial: null,
        naturezaJuridica: null,
        porte: null,
        optanteSimples: null,
        emailReceita: null,
        telefoneReceita: null,
        cnaePrincipal: null,
        cnaesSecundarios: [],
      },
      datas: {
        dataCadastroLegado: identidade.entradaEm.toISOString(),
        tempoComoCliente: tempoDecorrido(identidade.entradaEm),
      },
      contato: {
        nome: identidade.nome,
        email: `contato@${gerarIdentificador(identidade.nome).toLowerCase().replace("ag-", "")}.com.br`,
        telefone1: `(${11 + (base % 78)}) 9${String(1000 + (base % 8999)).padStart(4, "0")}-${String(base % 9999).padStart(4, "0")}`,
        telefone1Base: identidade.base,
        telefone2: null,
        telefoneComercial: null,
        emailReceita: null,
        telefoneReceita: null,
      },
      endereco: null,
      socios: [],
    },
    perfilComercial: {
      sica: identidade.sica,
      base: identidade.base,
      gestorNome: identidade.gestorNome,
      executivoNome: identidade.executivoNome,
      segmento: null,
      mediaFaturamento: null,
      bancoNome: null,
      bancoCodigo: null,
      bancoAgencia: null,
      bancoConta: null,
      limiteFaturado: Math.round(blocoVendas.volumeAno * (1.1 + ((base >> 4) % 30) / 100)),
      limiteCartao: Math.round(blocoVendas.volumeAno * (0.2 + ((base >> 6) % 15) / 100)),
      dataUltimaCompra: blocoVendas.dataUltimaCompra,
      comissaoPct: null,
      incentivoPct: null,
      bloqCred: base % 20 === 0,
    },
    vendas: blocoVendas.vendas,
  };
}
