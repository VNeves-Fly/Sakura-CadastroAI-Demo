// View do detalhe do gestor (/crm/gestores/:id) — header de identificação +
// dashboard consolidado da carteira (soma dos executivos subordinados a
// este gestor). Campos marcados "real" vêm de Gestor/Promotor/Agencia de
// verdade; os demais não têm fonte no backend hoje (sem venda, meta ou
// limite ligados a Agencia/Gestor) e são gerados de forma determinística
// no adapter, sempre comentados como mock — mesma filosofia de
// executivo-detalhe.types.ts. Trocar por agregação real assim que o
// backend expuser esse dado.
import type { GestorNivel } from "@/modules/gestores/types/gestor-nivel.types";

export interface GestorPerfil {
  id: string; // real
  nome: string; // real
  identificador: string; // mock — slug tipo "GEST-SAKURA" a partir do nome
  email: string | null; // real
  telefone: string | null; // real
  ativo: boolean; // mock — sem campo de status no model Gestor hoje
  nivel: GestorNivel; // mock (ver gestor-nivel.types.ts)
  bases: string[]; // real
  basePrincipal: string | null; // real (bases[0])
  totalExecutivos: number; // real — Promotor.gestorId === este gestor
  totalAgencias: number; // real — soma das agências de todos os executivos
  vendendoUltimos30d: number; // mock
  vendendoUltimos30dPct: number; // mock
}

// Filtro Dia/Ontem/Mês/Ano do card de receita total (mesmo padrão do
// dashboard de Executivo — ver executivo-detalhe.types.ts) — cada período
// tem seu próprio mock determinístico, ver gerarHeroPorPeriodo em
// gestor-detalhe.adapter.ts.
export type PeriodoVendasMesHeroGestor = "dia" | "ontem" | "mes" | "ano";

export interface VendasMesHeroGestor {
  valor: number;
  bilhetes: number;
  agenciasVendendo: number;
  variacaoPct: number; // vs mesmo dia do mês anterior
}

// KPIs Secundários (SPEC seção 3.8) — 3 cards: mês anterior, projeção fim
// do mês e vendendo 30d (esse último reaproveita os mesmos números do
// cabeçalho de perfil, GestorPerfil.vendendoUltimos30d/Pct). Mesmo shape
// de KpisSecundarios em executivo-detalhe.types.ts.
export interface KpisSecundariosGestor {
  mesAnteriorValor: number;
  mesAnteriorFaltaValor: number;
  mesAnteriorPercentualAtingido: number;
  projecaoFimMes: number;
  vendendo30d: number;
  vendendo30dPct: number;
}

// Resumo de um canal (Aéreo/Terrestre) dentro do card de receita total
// (SPEC seção 3.6) — mesmo shape/lógica de CanalResumo em
// executivo-detalhe.types.ts: guarda só razões/percentuais, o valor
// absoluto é derivado no componente a partir do valor do hero no período
// ativo (`valorCanal = heroValor * participacaoPct/100`).
export interface CanalResumoGestor {
  participacaoPct: number;
  margemPct: number;
  margemLYPct: number;
  margemVariacaoPct: number;
  rentabLYPct: number;
  rentabLYVariacaoPct: number;
  ticketMedio: number;
  nacPct: number;
  intPct: number;
}

export interface AgenciaSegmentoResumo {
  nome: string;
  cnpj: string;
  valor: number;
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
  quantidade?: number; // bilhetes/vendas — só nos rankings "Top 10" (SPEC 3.9)
}

// Ranking de executivos subordinados por saúde da carteira (% de agências
// vendendo nos últimos 30d) — nome é real (Promotor), fração/percentual
// são mock.
export interface RankingExecutivoSaude {
  id: string;
  nome: string; // real
  vendendo: number;
  total: number;
  pct: number;
}

export interface GestorDashboard {
  hero: Record<PeriodoVendasMesHeroGestor, VendasMesHeroGestor>;
  kpis: KpisSecundariosGestor;
  atualizadoEm: string; // "20/08 às 18:22"
  canalAereo: CanalResumoGestor;
  canalTerrestre: CanalResumoGestor;
  saudeCarteira: SegmentoSaude[];
  // Rankings "Top 10 Agências" (SPEC 3.9) — sempre "hoje", por modalidade.
  topAgenciasHoje: RankingAgencia[];
  topAgenciasHojeAereo: RankingAgencia[];
  topAgenciasHojeTerrestre: RankingAgencia[];
  // "Top 5 executivos" (SPEC 3.7) — seção exclusiva do Gestor, sem
  // equivalente no dashboard de Executivo.
  topExecutivosMelhorSaude: RankingExecutivoSaude[];
  topExecutivosAtencao: RankingExecutivoSaude[];
}

export interface GestorDetalheView {
  perfil: GestorPerfil;
  dashboard: GestorDashboard;
}
