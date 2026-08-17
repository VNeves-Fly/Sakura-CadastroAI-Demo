import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import type {
  AgenciaDaGestaoView,
  CategoriaPremiacao,
  PeriodoVendas,
} from "@/modules/gestores/types/gestor-agencias-tab.types";

const CATEGORIAS: CategoriaPremiacao[] = ["10K", "100K", "1M", "10M"];
const STATUS_DADOS_FALTANTES = new Set(["em_analise", "em_complementar"]);

export function montarAgenciasDaGestaoViewList(
  executivos: ExecutivoComCarteira[],
): AgenciaDaGestaoView[] {
  return executivos.flatMap((executivo) =>
    executivo.agencias.map((agencia) => {
      const seed = hashParaNumero(agencia.id);
      return {
        id: agencia.id,
        nome: agencia.razaoSocial,
        cnpj: agencia.cnpj,
        executivoId: executivo.id,
        executivoNome: executivo.nome,
        base: executivo.bases[0] ?? null,
        status: agencia.status,
        dadosFaltantes: STATUS_DADOS_FALTANTES.has(agencia.status),
        inativada: agencia.status === "recusado",
        categoria: CATEGORIAS[seed % CATEGORIAS.length]!,
        vendasAno: ((seed % 900) + 20) * 10_000,
        bilhetesAno: 20 + (seed % 400),
        diasSemComprar: seed % 400,
        limite: ((seed % 900) + 20) * 12_000,
      };
    }),
  );
}

// Fração do ano atribuída a cada período — mesma aproximação de
// executivo-agencias.adapter.ts.
const FRACAO_POR_PERIODO: Record<PeriodoVendas, number> = {
  mes: 1 / 12,
  "30d": 1 / 12,
  "90d": 1 / 4,
  ano: 1,
};

export function valorNoPeriodo(
  agencia: AgenciaDaGestaoView,
  periodo: PeriodoVendas,
): { vendas: number; bilhetes: number; ticketMedio: number } {
  const fracao = FRACAO_POR_PERIODO[periodo];
  const vendas = Math.round(agencia.vendasAno * fracao);
  const bilhetes = Math.max(0, Math.round(agencia.bilhetesAno * fracao));
  const ticketMedio = bilhetes > 0 ? Math.round(vendas / bilhetes) : 0;
  return { vendas, bilhetes, ticketMedio };
}
