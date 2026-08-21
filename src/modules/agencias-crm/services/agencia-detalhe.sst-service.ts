import {
  comCache,
  comFallback,
  diasAtrasIso,
  hojeIso,
  mapComConcorrenciaLimitada,
  sstGet,
} from "@/modules/agencias-crm/infrastructure/agencia-sst-client.util";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import type {
  FaturaAgencia,
  ReservaAgencia,
  TopCompanhiaAgencia,
  TopRotaAgencia,
  VendaMensalAgencia,
} from "@/modules/agencias-crm/types/agencia-detalhe.types";

// Cadastro comercial (identidade/contato/endereço/limites) pro modal de
// detalhe — dois endpoints complementares, achados por curl real
// (2026-08-21), nenhum dos dois pede filtro de executivo:
// - GET /api/reports/base-empresa-cadastro?codigoEmpresa=X: nome fantasia,
//   endereço, executivo, limites de crédito REAIS (limite_cred_faturado/
//   limite_cred_cartao_credito), bloqueio de crédito, data de cadastro,
//   status ativo/inativo (empresa_ativa) — e já devolve o CNPJ da empresa,
//   então basta esse código pra encadear a segunda chamada.
// - GET /api/agencias/cadastro?cnpj=X (com a máscara 00.000.000/0000-00,
//   não dígitos puros): razão social, contato, endereço mais completo,
//   IE/IM/IATA/EMBRATUR.
// Nenhum dos dois tem sócios, documentos, análise de risco ou dados da
// Receita Federal (CNAE, capital social) — esse bloco fica vazio/null pra
// agência sem cadastro de onboarding neste app (decisão do usuário,
// 2026-08-21: o modal do CRM não deve depender do banco local).
interface RawBaseEmpresaCadastro {
  codigo_empresa: number;
  empresa_ativa: "SIM" | "NÃO";
  nome_chave: string;
  nome_fantasia: string;
  CNPJ: string;
  endereco: string;
  numero: number | string | null;
  complemento: string | null;
  bairro: string;
  CEP: string;
  cidade: string;
  uf: string;
  telefone_principal: string;
  email_empresa: string;
  descricao_tipo_empresa: string;
  data_cadastro: string;
  filial_nome: string;
  codigo_executivo: number;
  nome_executivo: string;
  bloqueio_credito: "SIM" | "NÃO";
  limite_cred_faturado: number;
  total_limite_cred_faturado: number;
  limite_cred_cartao_credito: number;
  total_limite_cred_cartao_credito: number;
}

interface RawAgenciaCadastro {
  razao_social: string;
  cnpj: string;
  contato: string;
  telefone: string;
  email: string;
  endereco: string;
  numero: string | null;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

async function buscarBaseEmpresaCadastro(
  codigoEmpresa: number,
): Promise<RawBaseEmpresaCadastro | null> {
  return comCache(`agencias-crm:base-empresa-cadastro:${codigoEmpresa}`, async () => {
    const resposta = await sstGet<{ data: RawBaseEmpresaCadastro[] }>(
      "/api/reports/base-empresa-cadastro",
      { codigoEmpresa, limit: 1 },
    );
    return resposta.data[0] ?? null;
  });
}

async function buscarCadastroPorCnpj(cnpjDigitos: string): Promise<RawAgenciaCadastro | null> {
  return comCache(`agencias-crm:agencia-cadastro:${cnpjDigitos}`, async () => {
    const resposta = await sstGet<{ data: RawAgenciaCadastro[] }>("/api/agencias/cadastro", {
      cnpj: maskCnpj(cnpjDigitos),
      limit: 1,
    });
    return resposta.data[0] ?? null;
  });
}

export interface CadastroComercialSst {
  baseEmpresa: RawBaseEmpresaCadastro | null;
  cadastro: RawAgenciaCadastro | null;
}

// Integração real com o SST pro bloco "vendas" do modal de detalhe —
// UMA agência por vez (filtro `codigoEmpresa`, = sicaCodigo), diferente
// de agencia-carteira.sst-service.ts (carteira inteira). Por isso usa
// endpoints de agregado por empresa (rápidos, sem paginação) em vez dos
// agregados "resumo-agrupado" da carteira inteira — não depende do mapa
// da Fase 1.
//
// Achados por curl real (2026-08-21, agência de teste codigoEmpresa=46089
// — MAXMILHAS, uma consolidadora/OTA de volume muito alto):
// - /api/consolidado/air?codigoEmpresa=X&tipoRota=NAC|INTER filtra certo
//   e já devolve `ticket_medio` pronto (NAC+INTER somam exatamente o
//   total sem tipoRota).
// - /api/reports/ranking-cias?codigoEmpresa=X FILTRA CORRETAMENTE por
//   empresa (diferente do achado já documentado sobre filtro por
//   codigoExecutivo, que não funciona) — topCompanhias pode ser real.
// - /api/reports/itinerario-aereo?codigoEmpresa=X (com ou sem data) não
//   retornou nenhuma linha pra essa agência — parece ter uma lacuna de
//   cobertura pra este tipo de agência (grande revenda/OTA); não é
//   confiável. topRotas usa /api/resumos/aereo (mesmo endpoint da aba
//   Reservas) agregado por `rota` no próprio código, em vez de depender
//   desse endpoint.
// - /api/resumos/aereo?codigoEmpresa=X é por linha de bilhete (não
//   agregado) — uma agência grande tem >140k linhas/ano. Não pode
//   paginar tudo pra popular a aba "Reservas" (que só precisa de um
//   punhado de itens recentes, mesma ordem de grandeza do mock: 30-70).
//   O endpoint já devolve a página 1 ordenada pelas emissões mais
//   recentes primeiro (confirmado por amostra) — pega só 1 página, sem
//   paginação.
// - topRotas usa uma janela mais curta (90d) com paginação limitada
//   (poucas páginas, LIMITE_PAGINAS_TOP_ROTAS) — amostra suficiente pra
//   um ranking de rotas sem custear a paginação inteira do ano.

// `margem`/`rentabilidade` vêm prontos do SST nesses dois endpoints (curl
// real, 2026-08-21) — não precisam ser derivados; só não eram lidos até
// agora (só `tarifa`/`tickets`/`ticket_medio` eram usados).
interface RawConsolidadoPeriodo {
  tarifa: number;
  tickets: number;
  ticket_medio: number;
  rentabilidade: number;
  margem: number;
}

// Cacheadas (10min, mesma infra da Fase 1) — dentro da janela de cache,
// reabrir o modal da mesma agência, ou o loop mensal de
// buscarEvolucaoMensal revisitando um mês já consultado noutra seção,
// não repete a chamada ao SST.
async function buscarAir(
  codigoEmpresa: string,
  inicio: string,
  fim: string,
  tipoRota?: "NAC" | "INTER",
): Promise<RawConsolidadoPeriodo> {
  return comCache(
    `agencias-crm:detalhe:${codigoEmpresa}:air:${tipoRota ?? "-"}:${inicio}:${fim}`,
    () =>
      sstGet<RawConsolidadoPeriodo>("/api/consolidado/air", {
        codigoEmpresa,
        startDate: inicio,
        endDate: fim,
        tipoRota,
        status: "ATIVOS",
      }),
  );
}

async function buscarNonAir(
  codigoEmpresa: string,
  inicio: string,
  fim: string,
): Promise<RawConsolidadoPeriodo> {
  return comCache(`agencias-crm:detalhe:${codigoEmpresa}:nonair:${inicio}:${fim}`, () =>
    sstGet<RawConsolidadoPeriodo>("/api/consolidado/non-air", {
      codigoEmpresa,
      startDate: inicio,
      endDate: fim,
      status: "ATIVOS",
    }),
  );
}

const ZERO_PERIODO: RawConsolidadoPeriodo = {
  tarifa: 0,
  tickets: 0,
  ticket_medio: 0,
  rentabilidade: 0,
  margem: 0,
};

interface RawResumoAereoLinha {
  bilhete: string;
  rota: string;
  airline: string;
  data_emis: string;
  tarifa: number;
  cancelado: number;
}

interface RawResumoTerrestreLinha {
  loc: string;
  cliente: string;
  tipo_produto: string;
  data: string;
  tarifa_cliente: number;
  cancelado: number;
}

interface RawPaginado<T> {
  data: T[];
  total: number;
}

const LIMITE_RESERVAS_POR_CANAL = 30;
// ACHADO (curl real, 2026-08-21): /api/resumos/aereo sem startDate/endDate
// não devolve as linhas mais recentes primeiro (página 1 começa no início
// do dataset retido, ex.: 2025-01-01) — só COM uma janela de data a
// página passa a trazer linhas dentro dessa janela (ainda sem ordenação
// garantida por data). Por isso: sempre passar uma janela curta (bounded)
// e ordenar por data localmente antes de cortar pro tamanho da aba.
const JANELA_RESERVAS_AEREO_DIAS = 14;
const JANELA_RESERVAS_TERRESTRE_DIAS = 90; // terrestre tem volume bem mais baixo por agência — janela maior pra achar alguma linha

async function buscarReservasRecentes(
  codigoEmpresa: string,
): Promise<{ reservas: ReservaAgencia[]; dataUltimaCompra: string | null }> {
  const fim = hojeIso();
  return comCache(`agencias-crm:detalhe:${codigoEmpresa}:reservas:${fim}`, () =>
    buscarReservasRecentesSemCache(codigoEmpresa, fim),
  );
}

async function buscarReservasRecentesSemCache(
  codigoEmpresa: string,
  fim: string,
): Promise<{ reservas: ReservaAgencia[]; dataUltimaCompra: string | null }> {
  const [aereo, terrestre] = await Promise.all([
    comFallback(
      "reservas-aereo",
      sstGet<RawPaginado<RawResumoAereoLinha>>("/api/resumos/aereo", {
        codigoEmpresa,
        startDate: diasAtrasIso(JANELA_RESERVAS_AEREO_DIAS),
        endDate: fim,
        page: 1,
        limit: 200,
      }),
      { data: [], total: 0 },
    ),
    comFallback(
      "reservas-terrestre",
      sstGet<RawPaginado<RawResumoTerrestreLinha>>("/api/resumos/terrestre", {
        codigoEmpresa,
        startDate: diasAtrasIso(JANELA_RESERVAS_TERRESTRE_DIAS),
        endDate: fim,
        page: 1,
        limit: 200,
      }),
      { data: [], total: 0 },
    ),
  ]);

  const reservasAereo: ReservaAgencia[] = aereo.data
    .filter((linha) => !linha.cancelado)
    .map((linha) => ({
      id: `aereo-${linha.bilhete}`,
      tipo: "aereo" as const,
      data: linha.data_emis,
      identificador: linha.bilhete,
      descricao: linha.rota,
      referencia: linha.airline,
      valor: linha.tarifa,
    }));

  const reservasTerrestre: ReservaAgencia[] = terrestre.data
    .filter((linha) => !linha.cancelado)
    .map((linha) => ({
      id: `terrestre-${linha.loc}`,
      tipo: "terrestre" as const,
      data: linha.data,
      identificador: linha.loc,
      descricao: linha.tipo_produto || "Serviço terrestre",
      referencia: null,
      valor: linha.tarifa_cliente,
    }));

  const reservas = [...reservasAereo, ...reservasTerrestre].sort((a, b) =>
    b.data.localeCompare(a.data),
  );

  const dataUltimaCompra = reservas[0]?.data ?? null;

  return { reservas, dataUltimaCompra };
}

const JANELA_TOP_ROTAS_DIAS = 90;
const LIMITE_PAGINA_TOP_ROTAS = 500;
const LIMITE_PAGINAS_TOP_ROTAS = 4; // amostra de até 2000 bilhetes recentes — suficiente pra um ranking de rotas sem paginar o ano inteiro

async function buscarTopRotas(codigoEmpresa: string): Promise<TopRotaAgencia[]> {
  const inicio = diasAtrasIso(JANELA_TOP_ROTAS_DIAS);
  const fim = hojeIso();

  return comCache(`agencias-crm:detalhe:${codigoEmpresa}:top-rotas:${inicio}:${fim}`, async () => {
    const primeira = await sstGet<RawPaginado<RawResumoAereoLinha>>("/api/resumos/aereo", {
      codigoEmpresa,
      startDate: inicio,
      endDate: fim,
      page: 1,
      limit: LIMITE_PAGINA_TOP_ROTAS,
    });
    const totalPaginas = Math.min(
      Math.ceil(primeira.total / LIMITE_PAGINA_TOP_ROTAS),
      LIMITE_PAGINAS_TOP_ROTAS,
    );
    const numerosPaginasRestantes = Array.from(
      { length: Math.max(0, totalPaginas - 1) },
      (_, indice) => indice + 2,
    );
    const paginasRestantes = await mapComConcorrenciaLimitada(numerosPaginasRestantes, (pagina) =>
      sstGet<RawPaginado<RawResumoAereoLinha>>("/api/resumos/aereo", {
        codigoEmpresa,
        startDate: inicio,
        endDate: fim,
        page: pagina,
        limit: LIMITE_PAGINA_TOP_ROTAS,
      }),
    );

    const porRota = new Map<string, { bilhetes: number; volume: number }>();
    for (const pagina of [primeira, ...paginasRestantes]) {
      for (const linha of pagina.data) {
        if (linha.cancelado) continue;
        const atual = porRota.get(linha.rota) ?? { bilhetes: 0, volume: 0 };
        atual.bilhetes += 1;
        atual.volume += linha.tarifa;
        porRota.set(linha.rota, atual);
      }
    }

    return [...porRota.entries()]
      .map(([rota, valores]) => ({
        rota,
        bilhetes: valores.bilhetes,
        volume: Math.round(valores.volume),
        // Heurística best-effort: sem um flag nacional/internacional por
        // trecho nesta amostra — assume nacional (aeroportos brasileiros
        // têm 4 letras nos dados internos do SICA, ex. "GRU"/"VCP" já
        // aparecem com 3; não há um jeito barato de diferenciar aqui sem
        // uma tabela de aeroportos, então fica sempre `false` até existir
        // essa fonte).
        internacional: false,
      }))
      .sort((a, b) => b.bilhetes - a.bilhetes)
      .slice(0, 10);
  });
}

interface RawRankingCia {
  nome_cia: string;
  tarifa_total: number;
}

async function buscarTopCompanhias(
  codigoEmpresa: string,
  inicio: string,
  fim: string,
): Promise<TopCompanhiaAgencia[]> {
  return comCache(
    `agencias-crm:detalhe:${codigoEmpresa}:top-companhias:${inicio}:${fim}`,
    async () => {
      const resposta = await sstGet<RawPaginado<RawRankingCia>>("/api/reports/ranking-cias", {
        codigoEmpresa,
        startDate: inicio,
        endDate: fim,
        limit: 10,
      });
      return resposta.data.map((linha) => ({
        nome: linha.nome_cia,
        volume: Math.round(linha.tarifa_total),
      }));
    },
  );
}

interface RawFatura {
  numero_fatura: number;
  tipo_fatura: "AIR" | "TER";
  data_vencimento: string;
  pago: "SIM" | "NAO";
  cancelado: "SIM" | "NAO";
  valor: number;
}

async function buscarFaturas(
  codigoEmpresa: string,
  inicio: string,
  fim: string,
): Promise<FaturaAgencia[]> {
  const resposta = await comCache(
    `agencias-crm:detalhe:${codigoEmpresa}:faturas:${inicio}:${fim}`,
    () =>
      sstGet<RawPaginado<RawFatura>>("/api/agencias/faturas", {
        codigoEmpresa,
        startDate: inicio,
        endDate: fim,
        page: 1,
        limit: 100,
      }),
  );
  const hoje = hojeIso();

  return resposta.data
    .filter((fatura) => fatura.cancelado !== "SIM")
    .map((fatura) => ({
      numero: `#${fatura.numero_fatura}`,
      vencimento: fatura.data_vencimento,
      cias: fatura.tipo_fatura === "AIR" ? "Aéreo" : "Terrestre",
      status:
        fatura.pago === "SIM"
          ? "pago"
          : fatura.data_vencimento.slice(0, 10) < hoje
            ? "vencido"
            : "a_vencer",
      valor: fatura.valor,
    }));
}

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

// Evolução mensal do ano corrente — 1 chamada air + 1 non-air por mês
// (agregados, sem paginação). O split nacional/internacional dentro de
// cada mês usa a PROPORÇÃO real do ano inteiro (bilhetesNacionalAno /
// bilhetesAereoAno) em vez de tipoRota por mês — evita triplicar as
// chamadas (36 em vez de 12) por um detalhamento que a UI hoje não
// diferencia mês a mês; documentado aqui, não escondido.
async function buscarEvolucaoMensal(
  codigoEmpresa: string,
  proporcaoNacional: number,
): Promise<VendaMensalAgencia[]> {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoCurto = String(hoje.getFullYear()).slice(-2);

  const meses = Array.from({ length: mesAtual + 1 }, (_, indice) => indice);
  const porMes = await mapComConcorrenciaLimitada(
    meses,
    async (mesIndice) => {
      const inicioMes = new Date(hoje.getFullYear(), mesIndice, 1);
      const fimMes = new Date(hoje.getFullYear(), mesIndice + 1, 0);
      const inicio = formatarIso(inicioMes);
      const fim = formatarIso(fimMes > hoje ? hoje : fimMes);
      const [air, nonAir] = await Promise.all([
        buscarAir(codigoEmpresa, inicio, fim).catch(() => ZERO_PERIODO),
        buscarNonAir(codigoEmpresa, inicio, fim).catch(() => ZERO_PERIODO),
      ]);
      return { mesIndice, air, nonAir };
    },
    5,
  );

  return porMes.map(({ mesIndice, air, nonAir }) => ({
    mes: `${MESES_PT[mesIndice]}/${anoCurto}`,
    nacional: Math.round(air.tarifa * proporcaoNacional),
    internacional: Math.round(air.tarifa * (1 - proporcaoNacional)),
    terrestre: Math.round(nonAir.tarifa),
  }));
}

function formatarIso(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

// Margem/rentabilidade real de um canal (Aéreo ou Terrestre) — período
// atual (365d) e o mesmo período do ano anterior (365-730d atrás), pra
// dar "LY" e variação real (ver obterVendas).
export interface CanalMargemSst {
  margemPct: number;
  rentabilidade: number;
  margemLYPct: number;
  rentabilidadeLY: number;
}

export interface VendasReaisSst {
  aereoNacional: { volume: number; bilhetes: number };
  aereoInternacional: { volume: number; bilhetes: number };
  terrestre: { volume: number; servicos: number };
  ticketMedioAereo: number;
  variacaoMesAnterior: { pct: number; valor: number };
  evolucaoMensal: VendaMensalAgencia[];
  topRotas: TopRotaAgencia[];
  topCompanhias: TopCompanhiaAgencia[];
  reservas: ReservaAgencia[];
  faturas: FaturaAgencia[];
  diasSemComprar: number | null;
  dataUltimaCompra: string | null;
  margemAereo: CanalMargemSst;
  margemTerrestre: CanalMargemSst;
}

export const agenciaDetalheSstService = {
  // `base-empresa-cadastro` primeiro (já devolve o CNPJ) pra encadear
  // `agencias/cadastro` — uma chamada extra, não duas em paralelo, já que
  // a segunda depende do CNPJ que só a primeira devolve. `null` nos dois
  // significa "código SICA não existe no SST" (agência não encontrada).
  async obterCadastroComercial(codigoEmpresa: number): Promise<CadastroComercialSst> {
    const baseEmpresa = await buscarBaseEmpresaCadastro(codigoEmpresa);
    const cadastro = baseEmpresa ? await buscarCadastroPorCnpj(baseEmpresa.CNPJ) : null;
    return { baseEmpresa, cadastro };
  },

  // Uma chamada por abertura do modal (o fetch do detalhe é síncrono
  // hoje, sem streaming — ver route.ts). Cada sub-bloco tem fallback
  // isolado: se um falhar, os outros seguem reais.
  async obterVendas(sicaCodigo: string): Promise<VendasReaisSst> {
    const fim = hojeIso();
    const inicioAno = diasAtrasIso(365);
    const inicioMesAtual = diasAtrasIso(30);
    const inicioMesAnterior = diasAtrasIso(60);
    // 31, não 30: se fosse igual a inicioMesAtual, o dia de fronteira
    // entraria nas duas janelas (startDate/endDate são inclusivos no
    // SST) e o dia contaria duas vezes em variacaoMesAnterior.
    const fimMesAnterior = diasAtrasIso(31);
    // "LY" (mesmo período do ano anterior) pra margem/rentabilidade real
    // — janela de 365d adjacente à janela "ano" (365-730d atrás), sem
    // sobreposição, mesmo critério de fimMesAnterior acima.
    const inicioAnoLY = diasAtrasIso(730);
    const fimAnoLY = diasAtrasIso(365);

    const [
      aereoNac,
      aereoInter,
      terrestre,
      mesAtual,
      mesAnterior,
      reservasInfo,
      aereoLY,
      terrestreLY,
    ] = await Promise.all([
      comFallback("aereo-nacional", buscarAir(sicaCodigo, inicioAno, fim, "NAC"), ZERO_PERIODO),
      comFallback(
        "aereo-internacional",
        buscarAir(sicaCodigo, inicioAno, fim, "INTER"),
        ZERO_PERIODO,
      ),
      comFallback("terrestre-total", buscarNonAir(sicaCodigo, inicioAno, fim), ZERO_PERIODO),
      comFallback(
        "variacao-mes-atual",
        Promise.all([
          buscarAir(sicaCodigo, inicioMesAtual, fim),
          buscarNonAir(sicaCodigo, inicioMesAtual, fim),
        ]),
        [ZERO_PERIODO, ZERO_PERIODO] as [RawConsolidadoPeriodo, RawConsolidadoPeriodo],
      ),
      comFallback(
        "variacao-mes-anterior",
        Promise.all([
          buscarAir(sicaCodigo, inicioMesAnterior, fimMesAnterior),
          buscarNonAir(sicaCodigo, inicioMesAnterior, fimMesAnterior),
        ]),
        [ZERO_PERIODO, ZERO_PERIODO] as [RawConsolidadoPeriodo, RawConsolidadoPeriodo],
      ),
      comFallback("reservas", buscarReservasRecentes(sicaCodigo), {
        reservas: [] as ReservaAgencia[],
        dataUltimaCompra: null as string | null,
      }),
      // Sem `tipoRota` — combinado NAC+INTER direto do SST (confirmado
      // por curl real que bate com a soma dos dois filtrados).
      comFallback("aereo-margem-ly", buscarAir(sicaCodigo, inicioAnoLY, fimAnoLY), ZERO_PERIODO),
      comFallback(
        "terrestre-margem-ly",
        buscarNonAir(sicaCodigo, inicioAnoLY, fimAnoLY),
        ZERO_PERIODO,
      ),
    ]);

    const bilhetesAereoAno = aereoNac.tickets + aereoInter.tickets;
    const proporcaoNacional = bilhetesAereoAno > 0 ? aereoNac.tickets / bilhetesAereoAno : 1;

    const [topRotas, topCompanhias, faturas, evolucaoMensal] = await Promise.all([
      comFallback("top-rotas", buscarTopRotas(sicaCodigo), [] as TopRotaAgencia[]),
      comFallback(
        "top-companhias",
        buscarTopCompanhias(sicaCodigo, inicioAno, fim),
        [] as TopCompanhiaAgencia[],
      ),
      comFallback("faturas", buscarFaturas(sicaCodigo, inicioAno, fim), [] as FaturaAgencia[]),
      comFallback(
        "evolucao-mensal",
        buscarEvolucaoMensal(sicaCodigo, proporcaoNacional),
        [] as VendaMensalAgencia[],
      ),
    ]);

    const valorMesAtual = mesAtual[0].tarifa + mesAtual[1].tarifa;
    const valorMesAnterior = mesAnterior[0].tarifa + mesAnterior[1].tarifa;

    const dataUltimaCompra = reservasInfo.dataUltimaCompra;
    const diasSemComprar = dataUltimaCompra
      ? Math.max(0, Math.floor((Date.now() - new Date(dataUltimaCompra).getTime()) / 86_400_000))
      : null;

    // Aéreo combinado (NAC+INTER) — soma dos dois já buscados acima, não
    // precisa de uma 3ª chamada só pra margem/rentabilidade total.
    const tarifaAereoAno = aereoNac.tarifa + aereoInter.tarifa;
    const rentabilidadeAereoAno = aereoNac.rentabilidade + aereoInter.rentabilidade;
    const margemAereo: CanalMargemSst = {
      margemPct: tarifaAereoAno > 0 ? (rentabilidadeAereoAno / tarifaAereoAno) * 100 : 0,
      rentabilidade: rentabilidadeAereoAno,
      margemLYPct: aereoLY.margem,
      rentabilidadeLY: aereoLY.rentabilidade,
    };
    const margemTerrestre: CanalMargemSst = {
      margemPct: terrestre.margem,
      rentabilidade: terrestre.rentabilidade,
      margemLYPct: terrestreLY.margem,
      rentabilidadeLY: terrestreLY.rentabilidade,
    };

    return {
      aereoNacional: { volume: Math.round(aereoNac.tarifa), bilhetes: aereoNac.tickets },
      aereoInternacional: { volume: Math.round(aereoInter.tarifa), bilhetes: aereoInter.tickets },
      terrestre: { volume: Math.round(terrestre.tarifa), servicos: terrestre.tickets },
      ticketMedioAereo:
        bilhetesAereoAno > 0
          ? Math.round((aereoNac.tarifa + aereoInter.tarifa) / bilhetesAereoAno)
          : 0,
      variacaoMesAnterior: {
        pct:
          valorMesAnterior > 0 ? ((valorMesAtual - valorMesAnterior) / valorMesAnterior) * 100 : 0,
        valor: valorMesAtual - valorMesAnterior,
      },
      evolucaoMensal,
      topRotas,
      topCompanhias,
      reservas: reservasInfo.reservas.slice(0, LIMITE_RESERVAS_POR_CANAL),
      faturas,
      diasSemComprar,
      dataUltimaCompra,
      margemAereo,
      margemTerrestre,
    };
  },
};
