import type { GestorNivel } from "@/modules/gestores/types/gestor-nivel.types";

// View da linha da tabela de Gestores (lista). Identidade (nome, acesso,
// bases) é dado real. "executivos" também é real — contagem de Promotor com
// gestorId apontando pra este gestor (ver page.tsx). "nivel" é mock
// front-end (ver gestor-nivel.types.ts). As demais métricas de carteira
// (total/vend30d/paradas90d/vendasMes/vendasAno/limite/saude) não têm fonte
// real hoje — mesma decisão de promotor-lista.types.ts — e só existem depois
// que o usuário clica em "Visualizar dados" (pedido do usuário, 2026-08-17):
// nascem `null`, a tabela renderiza "-" enquanto isso.
export interface GestorListaView {
  id: string;
  nome: string;
  temAcesso: boolean;
  bases: string[];
  nivel: GestorNivel;
  executivos: number;
  semVenda: boolean | null;
  total: number | null;
  vendendo30d: number | null;
  paradas90d: number | null;
  vendasMes: number | null;
  vendasAno: number | null;
  limite: number | null;
  saudePercentual: number | null;
}

export interface GestorListaFiltros {
  busca: string;
}

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
