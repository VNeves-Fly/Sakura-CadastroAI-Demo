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

export interface MetaMes {
  valor: number;
  percentualAtingido: number;
  faltaValor: number;
  projecaoFimMes: number;
}

export interface VendasMesHeroGestor {
  valor: number;
  variacaoPct: number; // vs mesmo dia do mês anterior
  bilhetes: number;
  agenciasVendendo: number;
  executivosAtivos: number;
  meta: MetaMes;
}

export interface KpisSecundariosGestor {
  mesAnteriorValor: number;
  mesAnteriorMesReferencia: string; // "jul/26"
  projecaoFimMes: number;
  acumuladoAnoValor: number;
  acumuladoAnoBilhetes: number;
  ticketMedio30d: number;
}

export interface VendaMensal {
  mes: string; // "Jan/26"
  nacional: number;
  internacional: number;
  terrestre: number;
}

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

export interface AcaoPrioritariaAgencia {
  nome: string; // real
  cnpj: string; // real
  base: string | null; // real
  volume365d: number;
  diasSemComprar: number;
}

export interface GestorDashboard {
  hero: VendasMesHeroGestor;
  kpis: KpisSecundariosGestor;
  vendasMensais: VendaMensal[];
  vendasMensaisTotalAno: number;
  vendasMensaisNacionalPct: number;
  vendasMensaisInternacionalPct: number;
  tendencia30d: number[]; // 30 valores
  tendencia30dTotal: number;
  crossCanal: CrossCanal;
  saudeCarteira: SegmentoSaude[];
  topAgenciasMes: RankingAgencia[];
  topAgenciasAno: RankingAgencia[];
  topExecutivosMelhorSaude: RankingExecutivoSaude[];
  topExecutivosAtencao: RankingExecutivoSaude[];
  acoesPrioritarias: {
    paradasComHistorico: AcaoPrioritariaAgencia[];
    emQueda: AcaoPrioritariaAgencia[];
  };
}

export interface GestorDetalheView {
  perfil: GestorPerfil;
  dashboard: GestorDashboard;
}
