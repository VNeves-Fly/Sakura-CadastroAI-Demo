import {
  comCache,
  comFallback,
  diasAtrasIso,
  hojeIso,
  inicioMesIso,
  mapComConcorrenciaLimitada,
  sstGet,
} from "@/modules/agencias-crm/infrastructure/agencia-sst-client.util";
import type { CanalVendas } from "@/modules/agencias-crm/types/agencia-carteira.types";

// Integração real com o SST (sst.flysakura.com) pra popular as métricas
// comerciais da listagem /crm/agencias — SEM filtro de executivo (carteira
// inteira), irmã de executivo-dashboard.sst-service.ts (mesmo backend,
// mesmo padrão de cache/fallback), mas sem o parâmetro `codigoExecutivo`
// em nenhuma chamada. Validado por curl direto contra o SST (2026-08-21)
// antes de escrever isto:
// - GET /api/consolidado/air/resumo-agrupado?agruparPor=codigoEmpresa
//   (sem codigoExecutivo) retorna array direto (não paginado) com TODAS
//   as agências que venderam no período — 4912 linhas pra uma janela de
//   365 dias no dataset real, cada linha já com `ticket_medio` e
//   `data_ultima_venda` prontos (não precisa recomputar a partir de
//   tarifa/quantidade_bilhetes).
// - GET /api/resumos/terrestre não tem equivalente "resumo-agrupado" —
//   precisa paginar o bruto (confirmado: 60157 linhas / 121 páginas de
//   500 pra uma janela de 365 dias) e reduzir no próprio código.
//   ACHADO (curl direto, 2026-08-21): disparar as 121 páginas todas de
//   uma vez (Promise.all irrestrito, o padrão usado por
//   dashboard-vendas.sst-service.ts:502-518 pra este mesmo endpoint)
//   trava a maioria das conexões sem resposta — validado com curl puro,
//   fora do Node. 20 em paralelo respondeu limpo em ~14s; por isso a
//   paginação abaixo usa mapComConcorrenciaLimitada (bounded, não
//   Promise.all sobre o array inteiro) em vez de replicar o padrão dos
//   services-irmão nesse ponto específico.
const JANELA_ANO_DIAS = 365;

interface RawResumoAgrupadoAereo {
  codigo: number;
  nome: string;
  tarifa: number;
  quantidade_bilhetes: number;
  ticket_medio: number;
  data_ultima_venda: string; // ISO completo (ex.: "2026-08-21T03:00:00.000Z")
}

async function buscarAereoAgrupadoCarteira(
  inicio: string,
  fim: string,
): Promise<RawResumoAgrupadoAereo[]> {
  return comCache(`agencias-crm:aereo-agrupado:${inicio}:${fim}`, () =>
    sstGet<RawResumoAgrupadoAereo[]>("/api/consolidado/air/resumo-agrupado", {
      agruparPor: "codigoEmpresa",
      startDate: inicio,
      endDate: fim,
    }),
  );
}

interface RawPaginado<T> {
  data: T[];
  total: number;
}

interface RawResumoTerrestreLinha {
  codigo_cliente: number;
  tarifa_cliente: number;
  data: string; // ISO completo
  cancelado: number; // 0 | 1
}

interface AgregadoTerrestre {
  tarifaAno: number;
  qtdAno: number;
  tarifaMes: number;
  qtdMes: number;
  ultimaVenda: string | null;
}

const LIMITE_PAGINA_TERRESTRE = 500;

// Uma única varredura paginada da janela de 365 dias cobre também o
// mês-a-data (subconjunto da mesma janela) — evita paginar o dataset
// inteiro do SICA/SIGOT duas vezes só pra recortar um intervalo menor.
async function buscarTerrestreAgrupadoCarteira(
  inicioAno: string,
  fim: string,
  inicioMes: string,
): Promise<Map<number, AgregadoTerrestre>> {
  return comCache(`agencias-crm:terrestre-agrupado:${inicioAno}:${fim}`, async () => {
    const primeira = await sstGet<RawPaginado<RawResumoTerrestreLinha>>("/api/resumos/terrestre", {
      startDate: inicioAno,
      endDate: fim,
      page: 1,
      limit: LIMITE_PAGINA_TERRESTRE,
    });
    const totalPaginas = Math.ceil(primeira.total / LIMITE_PAGINA_TERRESTRE);
    const numerosPaginasRestantes = Array.from(
      { length: Math.max(0, totalPaginas - 1) },
      (_, indice) => indice + 2,
    );
    const paginasRestantes = await mapComConcorrenciaLimitada(numerosPaginasRestantes, (pagina) =>
      sstGet<RawPaginado<RawResumoTerrestreLinha>>("/api/resumos/terrestre", {
        startDate: inicioAno,
        endDate: fim,
        page: pagina,
        limit: LIMITE_PAGINA_TERRESTRE,
      }),
    );

    const agregados = new Map<number, AgregadoTerrestre>();
    for (const pagina of [primeira, ...paginasRestantes]) {
      for (const linha of pagina.data) {
        if (linha.cancelado) continue;
        const atual = agregados.get(linha.codigo_cliente) ?? {
          tarifaAno: 0,
          qtdAno: 0,
          tarifaMes: 0,
          qtdMes: 0,
          ultimaVenda: null,
        };
        atual.tarifaAno += linha.tarifa_cliente;
        atual.qtdAno += 1;
        if (linha.data >= inicioMes) {
          atual.tarifaMes += linha.tarifa_cliente;
          atual.qtdMes += 1;
        }
        // `linha.data` truthy: nunca grava uma data vazia/ausente como
        // "última venda" (o SST não documenta o campo como obrigatório).
        if (linha.data && (!atual.ultimaVenda || linha.data > atual.ultimaVenda)) {
          atual.ultimaVenda = linha.data;
        }
        agregados.set(linha.codigo_cliente, atual);
      }
    }
    return agregados;
  });
}

interface RawAgenciaAtivaCarteira {
  codigo_empresa: number;
  nome: string;
  cnpj: string;
  empresa_status: string;
  codigo_executivo: number | null;
  nome_executivo: string | null;
}

const LIMITE_PAGINA_ROSTER = 500;

// GET /api/agencias/ativas sem `codigoExecutivo` — mesmo endpoint do
// roster por executivo (ver executivo-dashboard.sst-service.ts:272), só
// sem o filtro: devolve o roster comercial inteiro, paginado, já com CNPJ
// e identidade do executivo (codigo_executivo/nome_executivo) por linha.
// Identidade/status de agência para /crm/agencias vêm 100% daqui, não da
// tabela `Agencia` deste app (decisão do usuário, 2026-08-21 — mesmo
// critério já aplicado à aba Agências do executivo).
async function buscarRosterCarteira(): Promise<RawAgenciaAtivaCarteira[]> {
  return comCache("agencias-crm:roster-completo", async () => {
    const primeira = await sstGet<RawPaginado<RawAgenciaAtivaCarteira>>("/api/agencias/ativas", {
      page: 1,
      limit: LIMITE_PAGINA_ROSTER,
    });
    const totalPaginas = Math.ceil(primeira.total / LIMITE_PAGINA_ROSTER);
    const numerosPaginasRestantes = Array.from(
      { length: Math.max(0, totalPaginas - 1) },
      (_, indice) => indice + 2,
    );
    const paginasRestantes = await mapComConcorrenciaLimitada(numerosPaginasRestantes, (pagina) =>
      sstGet<RawPaginado<RawAgenciaAtivaCarteira>>("/api/agencias/ativas", {
        page: pagina,
        limit: LIMITE_PAGINA_ROSTER,
      }),
    );
    return [primeira, ...paginasRestantes].flatMap((pagina) => pagina.data);
  });
}

export interface AgenciaRosterSst {
  codigoEmpresa: number;
  nome: string;
  cnpj: string;
  status: string;
  codigoExecutivo: number | null;
  nomeExecutivo: string | null;
}

export interface MetricasCarteiraSst {
  canal: CanalVendas;
  bilhetes: number;
  ticketMedio: number;
  vendasMes: number;
  vendasAno: number;
  diasSemComprar: number;
  // Exposta (não só o cálculo diasSemComprar) pra o modal de detalhe
  // conseguir mostrar a MESMA data que a listagem, em vez de recalcular
  // sozinho a partir de uma janela menor (ver agencia-detalhe.sst-service.ts).
  dataUltimaCompra: string;
}

function diasEntre(dataIso: string, hoje: Date): number {
  const diffMs = hoje.getTime() - new Date(dataIso).getTime();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

export const agenciaCarteiraSstService = {
  // Roster comercial completo (cacheado 10min) — fonte real de
  // identidade/status/executivo da listagem /crm/agencias.
  async obterRosterCompleto(): Promise<AgenciaRosterSst[]> {
    const roster = await buscarRosterCarteira();
    return roster.map((linha) => ({
      codigoEmpresa: linha.codigo_empresa,
      nome: linha.nome,
      cnpj: linha.cnpj,
      status: linha.empresa_status,
      codigoExecutivo: linha.codigo_executivo ?? null,
      nomeExecutivo: linha.nome_executivo ?? null,
    }));
  },

  // Uma chamada por carregamento de página (cacheada 10min) — devolve o
  // mapa completo, indexado por sicaCodigo (string, = codigo_empresa /
  // codigo_cliente do SST). Agência sem entrada aqui (sem sicaCodigo, sem
  // venda detectada em nenhum canal, ou SST indisponível) cai no mock por
  // hash no adapter — não é responsabilidade deste service decidir isso.
  async obterMetricasCarteira(): Promise<Map<string, MetricasCarteiraSst>> {
    const fim = hojeIso();
    const inicioAno = diasAtrasIso(JANELA_ANO_DIAS);
    const inicioMes = inicioMesIso();

    const [aereoAno, aereoMes, terrestre] = await Promise.all([
      buscarAereoAgrupadoCarteira(inicioAno, fim),
      buscarAereoAgrupadoCarteira(inicioMes, fim),
      comFallback(
        "terrestre-agrupado",
        buscarTerrestreAgrupadoCarteira(inicioAno, fim, inicioMes),
        new Map<number, AgregadoTerrestre>(),
      ),
    ]);

    const vendasMesAereoPorCodigo = new Map(aereoMes.map((linha) => [linha.codigo, linha.tarifa]));
    const agora = new Date();
    const resultado = new Map<string, MetricasCarteiraSst>();

    for (const linha of aereoAno) {
      const chave = String(linha.codigo);
      const terrestreLinha = terrestre.get(linha.codigo);
      const vendasAno = linha.tarifa + (terrestreLinha?.tarifaAno ?? 0);
      const vendasMes =
        (vendasMesAereoPorCodigo.get(linha.codigo) ?? 0) + (terrestreLinha?.tarifaMes ?? 0);
      const bilhetes = linha.quantidade_bilhetes + (terrestreLinha?.qtdAno ?? 0);
      const ultimaVendaMaisRecente = [linha.data_ultima_venda, terrestreLinha?.ultimaVenda]
        .filter((data): data is string => Boolean(data))
        .sort()
        .at(-1)!;

      resultado.set(chave, {
        canal: terrestreLinha ? "ambos" : "aereo",
        bilhetes,
        ticketMedio: bilhetes > 0 ? Math.round(vendasAno / bilhetes) : 0,
        vendasMes,
        vendasAno,
        diasSemComprar: diasEntre(ultimaVendaMaisRecente, agora),
        dataUltimaCompra: ultimaVendaMaisRecente,
      });
    }

    // Agências que só venderam terrestre (sem nenhuma linha no agregado
    // aéreo) — ainda não têm entrada no mapa.
    for (const [codigo, terrestreLinha] of terrestre) {
      const chave = String(codigo);
      if (resultado.has(chave)) continue;
      resultado.set(chave, {
        canal: "terrestre",
        bilhetes: terrestreLinha.qtdAno,
        ticketMedio:
          terrestreLinha.qtdAno > 0
            ? Math.round(terrestreLinha.tarifaAno / terrestreLinha.qtdAno)
            : 0,
        vendasMes: terrestreLinha.tarifaMes,
        vendasAno: terrestreLinha.tarifaAno,
        diasSemComprar: terrestreLinha.ultimaVenda
          ? diasEntre(terrestreLinha.ultimaVenda, agora)
          : 0,
        dataUltimaCompra: terrestreLinha.ultimaVenda ?? "",
      });
    }

    return resultado;
  },
};
