import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type { AgenciaCarteiraResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";
import type {
  AgenciaCarteiraView,
  CategoriaPremiacao,
  PeriodoVendas,
} from "@/modules/atribuicoes/types/executivo-agencias.types";

// Faixas redondas batendo com os labels da UI (10K/100K/1M/10M) — sem
// spec formal de limiar, mas agora é uma regra de negócio real sobre
// `vendasAno` (SST), não mais um hash aleatório por agência.
export function categoriaPorVendas(vendasAno: number): CategoriaPremiacao {
  if (vendasAno >= 10_000_000) return "10M";
  if (vendasAno >= 1_000_000) return "1M";
  if (vendasAno >= 100_000) return "100K";
  return "10K";
}

// "Limite de crédito comercial" continua bloqueado (não existe no schema
// espelhado do SICA, ver docs/mock-exec-resp.md) — mock determinístico
// seedado pelo código SST da agência (não mais pelo id local do banco).
// Exportada pelo mesmo motivo de categoriaPorVendas acima.
export function limiteMock(codigo: number): number {
  const seed = hashParaNumero(String(codigo));
  return ((seed % 900) + 20) * 12_000;
}

export function montarAgenciaCarteiraView(agencia: AgenciaCarteiraResumo): AgenciaCarteiraView {
  return {
    id: String(agencia.codigo),
    nome: agencia.nome,
    cnpj: agencia.cnpj,
    status: agencia.status,
    canal: agencia.canal,
    faixaRecencia: agencia.faixaRecencia,
    categoria: categoriaPorVendas(agencia.vendasAno),
    vendasAno: agencia.vendasAno,
    bilhetesAno: agencia.bilhetesAno,
    vendas90d: agencia.vendas90d,
    bilhetes90d: agencia.bilhetes90d,
    vendas30d: agencia.vendas30d,
    bilhetes30d: agencia.bilhetes30d,
    limite: limiteMock(agencia.codigo),
  };
}

export function montarAgenciasCarteiraViewList(
  agencias: AgenciaCarteiraResumo[],
): AgenciaCarteiraView[] {
  return agencias.map(montarAgenciaCarteiraView);
}

// "mes" não tem janela própria buscada no SST (só 30d/90d/365d, ver
// executivo-dashboard.sst-service.ts) — aproximado pelos últimos 30 dias
// (mesma ordem de grandeza de "mês corrente até hoje" na maior parte do
// mês). "30d"/"90d"/"ano" são exatos, vindos direto do SST.
export function valorNoPeriodo(
  agencia: AgenciaCarteiraView,
  periodo: PeriodoVendas,
): { vendas: number; bilhetes: number; ticketMedio: number } {
  const { vendas, bilhetes } =
    periodo === "ano"
      ? { vendas: agencia.vendasAno, bilhetes: agencia.bilhetesAno }
      : periodo === "90d"
        ? { vendas: agencia.vendas90d, bilhetes: agencia.bilhetes90d }
        : { vendas: agencia.vendas30d, bilhetes: agencia.bilhetes30d };
  const ticketMedio = bilhetes > 0 ? Math.round(vendas / bilhetes) : 0;
  return { vendas, bilhetes, ticketMedio };
}
