// View do detalhe do executivo (/executivos/:id) — header de perfil +
// dashboard (SPEC seções 3-4). Campos marcados "real" vêm de Promotor/
// Agencia de verdade; os demais não têm fonte no backend hoje (sem venda,
// meta, visita ou limite ligados a Agencia/Promotor) e são gerados de
// forma determinística no adapter, sempre comentados como mock — trocar
// por agregação real assim que o backend expuser esse dado.

export interface ExecutivoAgenciaResumo {
  id: string;
  nome: string; // real: razaoSocial (Agencia não expõe nomeFantasia aqui)
  cnpj: string; // real
  status: string; // real
  criadoEm: Date; // real
}

export interface ExecutivoConquistas {
  agencias10k: number;
  agencias100k: number;
  agencias1m: number;
  agencias10m: number;
  agenciasSemVenda: number;
}

export interface ExecutivoPerfil {
  id: string;
  nome: string;
  sica: number | null;
  email: string;
  bases: string[];
  gestorNome: string | null;
  totalAgencias: number; // real
  vendendoUltimos30d: number;
  vendendoUltimos30dPct: number;
  conquistas: ExecutivoConquistas;
}

export interface VendasMesHero {
  valor: number;
  bilhetes: number;
  agenciasVendendo: number;
  variacaoPct: number; // vs mesmo dia do mês anterior
}

// Filtro Dia/Ontem/Mês/Ano do card hero (reaproveita o PeriodToggle já
// usado no dashboard-vendas) — cada período tem seu próprio mock
// determinístico, ver gerarHeroPorPeriodo em executivo-detalhe.adapter.ts.
export type PeriodoVendasMesHero = "dia" | "ontem" | "mes" | "ano";

export interface KpisSecundarios {
  mesAnteriorValor: number;
  mesAnteriorFaltaValor: number;
  mesAnteriorPercentualAtingido: number;
  projecaoFimMes: number;
  acumuladoAnoValor: number;
  acumuladoAnoBilhetes: number;
  ticketMedio30d: number;
}

export interface MiniStats {
  agencias: number; // real (= totalAgencias)
  vendendo30d: number;
  vendendo30dPct: number;
  ociosasLimite: number;
  comCredito: number;
}

export interface LoyaltyChip {
  companhia: string;
  quantidade: number;
  destaque: boolean;
}

export interface VendaMensal {
  mes: string; // "Jan/26"
  nacional: number;
  internacional: number;
  terrestre: number;
}

// Linha de detalhe usada nos modais de "ver lista" (cross-canal e saúde
// da carteira) — mock (ver comentário do topo do arquivo), gerada só pra
// os cards clicáveis abrirem uma lista de verdade em vez de um número
// solto.
export interface AgenciaSegmentoResumo {
  nome: string;
  cnpj: string;
  valor: number;
}

export interface SegmentoComLista {
  quantidade: number;
  pct: number;
  agencias: AgenciaSegmentoResumo[];
}

export interface CrossCanal {
  ativasUltimos12m: number;
  aprovadas: number; // real (= totalAgencias)
  volAereo: number;
  volTerrestre: number;
  soAereo: SegmentoComLista;
  soTerrestre: SegmentoComLista;
  ambos: SegmentoComLista;
}

export interface SegmentoSaude {
  chave: "ativas" | "potenciais" | "ociosas" | "inativas";
  label: string;
  descricao: string;
  quantidade: number;
  pct: number;
  agencias: AgenciaSegmentoResumo[];
}

export interface RankingAgencia {
  posicao: number;
  nome: string; // real
  valor: number;
}

export interface AgenciaRisco {
  nome: string; // real
  cnpj: string; // real
  volume365d: number;
  diasSemComprar: number;
}

export interface AgenciaEmQueda {
  nome: string; // real
  mediaMensal12m: number;
  vendasAtual: number;
  quedaPct: number;
}

export interface ExecutivoDashboard {
  hero: Record<PeriodoVendasMesHero, VendasMesHero>;
  kpis: KpisSecundarios;
  miniStats: MiniStats;
  fidelidadePorCompanhia: LoyaltyChip[];
  vendasMensais: VendaMensal[];
  vendasMensaisTotalAno: number;
  vendasMensaisVariacaoAltaPct: number;
  vendasMensaisVariacaoBaixaPct: number;
  tendencia30d: number[]; // 30 valores
  tendencia30dTotal: number;
  crossCanal: CrossCanal;
  saudeCarteira: SegmentoSaude[];
  topAgenciasMes: RankingAgencia[];
  topAgenciasAno: RankingAgencia[];
  paradasComHistorico: AgenciaRisco[];
  emQueda: AgenciaEmQueda[];
}

export interface ExecutivoDetalheView {
  perfil: ExecutivoPerfil;
  dashboard: ExecutivoDashboard;
}
