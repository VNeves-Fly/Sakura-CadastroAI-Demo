import {
  sstGet,
  comCache,
  mapComConcorrenciaLimitada,
  hojeIso,
} from "@/modules/agencias-crm/infrastructure/agencia-sst-client.util";

// Integração real com o SST pra aproximar a "1ª compra" de cada agência
// nova — o SST não tem endpoint dedicado pra isso (só "última venda"
// agregada, ver agencia-carteira.sst-service.ts). Como aqui são só as
// poucas dezenas de agências aprovadas nos últimos 90 dias (não a
// carteira inteira), pagina /api/resumos/aereo e /api/resumos/terrestre
// por agência, numa janela que já começa na própria data de aprovação —
// a venda mais antiga encontrada é exata, não uma amostra limitada,
// porque não existe venda anterior à janela por definição.

interface RawResumoAereoLinha {
  data_emis: string;
  cancelado: number;
}

interface RawResumoTerrestreLinha {
  data: string;
  cancelado: number;
}

interface RawPaginado<T> {
  data: T[];
  total: number;
}

const LIMITE_PAGINA = 500;
const LIMITE_CONCORRENCIA_AGENCIAS = 15;

async function buscarTodasPaginas<T>(
  caminho: string,
  codigoEmpresa: string,
  inicio: string,
  fim: string,
): Promise<T[]> {
  const primeira = await sstGet<RawPaginado<T>>(caminho, {
    codigoEmpresa,
    startDate: inicio,
    endDate: fim,
    page: 1,
    limit: LIMITE_PAGINA,
  });
  const totalPaginas = Math.ceil(primeira.total / LIMITE_PAGINA);
  const numerosPaginasRestantes = Array.from(
    { length: Math.max(0, totalPaginas - 1) },
    (_, indice) => indice + 2,
  );
  const paginasRestantes = await mapComConcorrenciaLimitada(numerosPaginasRestantes, (pagina) =>
    sstGet<RawPaginado<T>>(caminho, {
      codigoEmpresa,
      startDate: inicio,
      endDate: fim,
      page: pagina,
      limit: LIMITE_PAGINA,
    }),
  );
  return [primeira, ...paginasRestantes].flatMap((pagina) => pagina.data);
}

export interface AgenciaParaPrimeiraCompra {
  codigoEmpresa: string;
  entradaIso: string; // YYYY-MM-DD, início da janela de busca (data de aprovação)
}

export const novasAgenciasSstService = {
  // Uma chamada (paginada) por agência, paralelizada com concorrência
  // limitada — poucas dezenas de agências, cada uma com janela curta
  // (no máximo 90 dias), bem diferente do volume de /crm/agencias.
  // Cacheado por codigoEmpresa+janela (10min, ver comCache).
  async obterPrimeirasComprasPorAgencia(
    agencias: AgenciaParaPrimeiraCompra[],
  ): Promise<Map<string, string | null>> {
    const fim = hojeIso();

    const resultados = await mapComConcorrenciaLimitada(
      agencias,
      async ({ codigoEmpresa, entradaIso }) => {
        const primeiraCompra = await comCache(
          `novas-agencias:primeira-compra:${codigoEmpresa}:${entradaIso}`,
          async () => {
            const [aereo, terrestre] = await Promise.all([
              buscarTodasPaginas<RawResumoAereoLinha>(
                "/api/resumos/aereo",
                codigoEmpresa,
                entradaIso,
                fim,
              ),
              buscarTodasPaginas<RawResumoTerrestreLinha>(
                "/api/resumos/terrestre",
                codigoEmpresa,
                entradaIso,
                fim,
              ),
            ]);

            const datas = [
              ...aereo.filter((linha) => !linha.cancelado).map((linha) => linha.data_emis),
              ...terrestre.filter((linha) => !linha.cancelado).map((linha) => linha.data),
            ]
              .filter(Boolean)
              .sort();

            return datas[0] ?? null;
          },
        );
        return { codigoEmpresa, primeiraCompra };
      },
      LIMITE_CONCORRENCIA_AGENCIAS,
    );

    return new Map(
      resultados.map((resultado) => [resultado.codigoEmpresa, resultado.primeiraCompra]),
    );
  },
};
