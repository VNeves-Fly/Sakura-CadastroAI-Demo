import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { ExecutivoAgenciaResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";
import type {
  AgenciaCarteiraView,
  CategoriaPremiacao,
  PeriodoVendas,
} from "@/modules/atribuicoes/types/executivo-agencias.types";

const CATEGORIAS: CategoriaPremiacao[] = ["10K", "100K", "1M", "10M"];
const STATUS_DADOS_FALTANTES = new Set(["em_analise", "em_complementar"]);

export function montarAgenciaCarteiraView(agencia: ExecutivoAgenciaResumo): AgenciaCarteiraView {
  const seed = hashParaNumero(agencia.id);
  // ~1 em 10 nasce sem venda no ano (mesmo padrão de gerarMetricasMock em
  // promotor-lista.adapter.ts) — sem essa variação o filtro "Apenas
  // agências que estão comprando" nunca excluiria ninguém, já que toda
  // agência teria vendasAno positivo.
  const semVenda = seed % 10 === 0;

  return {
    id: agencia.id,
    nome: agencia.nome,
    cnpj: agencia.cnpj,
    status: agencia.status,
    dadosFaltantes: STATUS_DADOS_FALTANTES.has(agencia.status),
    inativada: agencia.status === "recusado",
    categoria: CATEGORIAS[seed % CATEGORIAS.length]!,
    vendasAno: semVenda ? 0 : ((seed % 900) + 20) * 10_000,
    bilhetesAno: semVenda ? 0 : 20 + (seed % 400),
    diasSemComprar: seed % 400,
    limite: ((seed % 900) + 20) * 12_000,
  };
}

export function montarAgenciasCarteiraViewList(
  agencias: ExecutivoAgenciaResumo[],
): AgenciaCarteiraView[] {
  return agencias.map(montarAgenciaCarteiraView);
}

// Fração do ano atribuída a cada período — aproximação só pra a tabela
// não mostrar sempre o valor anual cheio quando o usuário troca de
// período (não é uma série temporal real, é derivada do total anual).
const FRACAO_POR_PERIODO: Record<PeriodoVendas, number> = {
  mes: 1 / 12,
  "30d": 1 / 12,
  "90d": 1 / 4,
  ano: 1,
};

export function valorNoPeriodo(
  agencia: AgenciaCarteiraView,
  periodo: PeriodoVendas,
): { vendas: number; bilhetes: number; ticketMedio: number } {
  const fracao = FRACAO_POR_PERIODO[periodo];
  const vendas = Math.round(agencia.vendasAno * fracao);
  const bilhetes = Math.max(0, Math.round(agencia.bilhetesAno * fracao));
  const ticketMedio = bilhetes > 0 ? Math.round(vendas / bilhetes) : 0;
  return { vendas, bilhetes, ticketMedio };
}
