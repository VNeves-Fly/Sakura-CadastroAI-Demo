import type { GestorNivel } from "@/modules/gestores/types/gestor-nivel.types";

// View da linha da tabela de Gestores (lista). Identidade (nome, acesso,
// bases) é dado real. "executivos" também é real — contagem de Promotor com
// gestorId apontando pra este gestor (ver page.tsx). "vendasMes"/"vendasAno"/
// "semVenda" são reais desde 2026-08-24 — soma das vendas reais (SST) dos
// executivos subordinados (ver page.tsx/vendasPorGestor). "nivel" é mock
// front-end (ver gestor-nivel.types.ts). As demais métricas de carteira
// (total/vend30d/paradas90d/limite/saude) não têm fonte real hoje — mesma
// decisão de promotor-lista.types.ts — mock determinístico sempre calculado
// e apenas mascarado via SensitiveValue quando o toggle global de
// visibilidade (useDataVisibility) estiver oculto.
export interface GestorListaView {
  id: string;
  nome: string;
  temAcesso: boolean;
  bases: string[];
  nivel: GestorNivel;
  executivos: number;
  semVenda: boolean;
  total: number;
  vendendo30d: number;
  paradas90d: number;
  vendasMes: number;
  vendasAno: number;
  limite: number;
  saudePercentual: number;
}

export interface GestorListaFiltros {
  busca: string;
}

// Paginação client-side da lista (mockup Claude Design, 2026-08-24,
// "Gestores" — a lista antes rolava inteira, sem paginador) — mesmo
// tamanho de página de TAMANHO_PAGINA_EXECUTIVOS, em promotor-lista.types.ts.
export const TAMANHO_PAGINA_GESTORES = 25;

export type GestorListaColunaOrdenavel =
  | "nome"
  | "executivos"
  | "total"
  | "vendendo30d"
  | "paradas90d"
  | "vendasMes"
  | "vendasAno"
  | "limite"
  | "saudePercentual";
