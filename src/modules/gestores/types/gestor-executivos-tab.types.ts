// View de linha da aba "Executivos" do detalhe do Gestor (SPEC seção 6,
// specdetalhesgestor.md) — identidade (nome/email/sica/bases) e "aprovadas"
// (contagem real de agências da carteira) vêm de dado real. As demais
// métricas de carteira não têm fonte real hoje (mesma decisão documentada
// em promotor-lista.types.ts para a lista de Executivos) — mock
// determinístico via hash, sempre calculado (mascarado por SensitiveValue).
export interface ExecutivoDaGestaoView {
  id: string;
  nome: string;
  email: string;
  sica: number | null;
  bases: string[];
  semVendaAno: boolean; // mock — deriva de vendasAno === 0
  aprovadas: number; // real — quantidade de agências da carteira
  vendendo30d: number;
  paradas90d: number;
  vendasMes: number;
  vendasAno: number;
  limite: number;
  saudePercentual: number;
}
