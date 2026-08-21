// Modelo de dados da página /crm/tv — 100% mock por enquanto (sem fonte
// real ainda, mesmo estágio inicial do dashboard-vendas). Um único filtro
// de período dirige a página toda (ver tv-view.tsx) — diferente do spec
// original do Lovable (6 toggles independentes, um por card): decisão do
// usuário, 2026-08-20, mesmo padrão já adotado no "filtro por tempo" do
// Dashboard CRM (ver dashboard-vendas/stores/filtro-periodo-dashboard.store.ts).

export type PeriodoTv = "hoje" | "ontem" | "mes" | "ano";

export interface VendasResumoTv {
  valorTotal: number;
  margemPct: number;
}

export interface CanalTv {
  valorTotal: number;
  bilhetes: number;
  agencias: number;
  ticketMedio: number;
  nacPct: number;
  intlPct: number;
}

export interface CompanhiaShareTv {
  nome: string;
  corHex: string;
  pct: number;
  valorAbsoluto: number;
}

export interface Top10LinhaTv {
  posicao: number;
  nome: string;
  valor: number;
  margemPct: number;
}

export interface TvData {
  // Fixos — sempre os 3 juntos, não seguem o filtro de período da página.
  vendas: {
    hoje: VendasResumoTv;
    mes: VendasResumoTv;
    ano: VendasResumoTv;
  };
  // Daqui pra baixo, tudo é `Record<PeriodoTv, ...>` — a página lê a
  // chave do período selecionado no filtro único.
  aereo: Record<PeriodoTv, CanalTv>;
  terrestre: Record<PeriodoTv, CanalTv>;
  shareAereo: Record<PeriodoTv, CompanhiaShareTv[]>;
  top10Clientes: Record<PeriodoTv, Top10LinhaTv[]>;
  top10Nacional: Record<PeriodoTv, Top10LinhaTv[]>;
  top10Internacional: Record<PeriodoTv, Top10LinhaTv[]>;
}
