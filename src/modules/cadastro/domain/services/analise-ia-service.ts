import type {
  AnaliseIaComparacaoCampo,
  DocumentAnalysisResultado,
} from "@/modules/cadastro/domain/services/document-analysis-service";

export type { AnaliseIaComparacaoCampo };

export interface AnaliseIaSocioInput {
  nome: string;
  cpf: string;
  dataNascimento: string; // ISO (YYYY-MM-DD) — cruzado contra o extraído do RG/CNH
  rgPath: string;
  // Resultado já processado pela etapa de análise individual
  // (documentAnalysisService.analisar(), document_type "doc_identificacao")
  // — a avaliação final reaproveita esse resultado em vez de mandar só a
  // referência do arquivo, pra não depender só do checkpoint implícito do
  // LangGraph por session_id.
  rgAnalise: DocumentAnalysisResultado;
  // Procuração ainda não é analisada por documentAnalysisService (só
  // contrato_social e doc_identificacao hoje) — quando isso for implementado
  // (novo document_type "procuracao"), o resultado entra aqui do mesmo jeito
  // que rgAnalise, e o adapter passa a incluir mais um item em
  // socios[].documentos.
}

export interface AnaliseIaInput {
  cnpj: string;
  razaoSocial: string;
  email: string;
  socios: AnaliseIaSocioInput[];
}

// Resultado do cruzamento de um documento específico (stage3) — nome do
// campo de resposta é `tipo` (não `document_type`, que é o que se manda
// na requisição — nomenclatura diferente entre request/response da API).
export interface AnaliseIaDocumentoDetalhe {
  tipo: string;
  campos: AnaliseIaComparacaoCampo[];
  alertasExtracao: string[];
  valido: boolean;
}

export interface AnaliseIaSocioDetalhe {
  nome: string;
  documentos: AnaliseIaDocumentoDetalhe[];
}

// Stage 1 (verificação cadastral) do /agency-analysis/sync — dados
// "oficiais" que o AgentsService busca na Receita/BrasilAPI, já como
// comparação contra o que foi fornecido. Substitui a consulta direta a
// ReceitaWS que o CadastroAI fazia antes (ver FinalizarCadastroUseCase).
export interface AnaliseIaCampoComparado {
  fornecido: string | null;
  oficial: string | null;
  confere: boolean | null;
}

export interface AnaliseIaCnaePrincipal {
  codigo: string | null;
  descricao: string | null;
  compativelTurismo: boolean | null;
}

export interface AnaliseIaSociosComparados {
  fornecidos: Array<Record<string, unknown>>;
  oficiais: Array<Record<string, unknown>>;
  divergencias: string[];
}

// Validação estrutural do e-mail (MX + domínio corporativo) — não é uma
// comparação com "oficial" como os outros campos de stage1, é checagem de
// formato/entregabilidade.
export interface AnaliseIaEmailInfo {
  fornecido: string | null;
  hasMx: boolean;
  corporativo: boolean;
}

export interface AnaliseIaProcessos {
  verificado: boolean;
  resumo: string | null;
}

export interface AnaliseIaStage1 {
  situacaoCadastral: string | null;
  cnaePrincipal: AnaliseIaCnaePrincipal | null;
  // Mesma forma de cnaePrincipal, lista de CNAEs secundários.
  cnaesSecundarios: AnaliseIaCnaePrincipal[];
  razaoSocial: AnaliseIaCampoComparado | null;
  nomeFantasia: AnaliseIaCampoComparado | null;
  email: AnaliseIaEmailInfo | null;
  socios: AnaliseIaSociosComparados | null;
  processos: AnaliseIaProcessos | null;
}

// Detalhamento do stage3 (cruzamento documental) devolvido pelo
// /agency-analysis/sync — usado pra dar contexto ao analista quando o
// parecer não é APROVADO, em vez de só "algo divergiu".
export interface AnaliseIaDetalhamento {
  documentosEmpresa: AnaliseIaDocumentoDetalhe[];
  socios: AnaliseIaSocioDetalhe[];
}

// Stage 2 (análise de crédito — SOFIA, processos judiciais, reclamações e
// AMAT) do /agency-analysis/sync — só executa quando `verificar_amat`/
// `verificar_processos` são mandados `true` no request (ver
// FlysakuraAnaliseIaAdapter). AMAT tem schema tipado do lado do agente
// (`AmatResult` no OpenAPI deles); sofia/processos_judiciais/reclamacoes
// continuam `additionalProperties: true` (dict livre, sem contrato) — não
// documentado nem do lado deles, então tratado como unknown aqui também,
// igual a `camposExtraidos`/`camposExtras` já fazem noutros lugares.
export interface AnaliseIaAmatPendenciaItem {
  qtde: number;
  total: number;
  itens: Record<string, unknown>[];
}

export interface AnaliseIaAmatPendencias {
  pefin: AnaliseIaAmatPendenciaItem;
  refin: AnaliseIaAmatPendenciaItem;
  protestos: AnaliseIaAmatPendenciaItem;
  chequesSemFundo: AnaliseIaAmatPendenciaItem;
  dividasVencidas: AnaliseIaAmatPendenciaItem;
  totalPendencias: number;
}

export interface AnaliseIaAmatSocioRestricao {
  nome: string;
  cpf: string;
  percParticipacao: number | null;
  cargo: string | null;
  pendencias: AnaliseIaAmatPendencias;
}

export interface AnaliseIaAmat {
  consultado: boolean;
  ultimaConsulta: string | null;
  empresa: AnaliseIaAmatPendencias | null;
  sociosComRestricao: AnaliseIaAmatSocioRestricao[];
  totalGeral: number;
}

export interface AnaliseIaStage2 {
  amat: AnaliseIaAmat | null;
  sofia: Record<string, unknown> | null;
  processosJudiciais: Record<string, unknown> | null;
  reclamacoes: Record<string, unknown> | null;
  debtTotal: number | null;
}

// Chamada de tool exatamente como aconteceu (antes de qualquer sumarização
// em stage1/stage2/stage3) — agrupada por fonte (ver `_TOOL_SOURCE` do
// agents-service: amat/sofia/receita/cadastur/email/datajud/jusbrasil/
// reclame_aqui). A chave não é um union fechado: uma tool nova sem entrada
// em `_TOOL_SOURCE` cai num bucket com o próprio nome dela em vez de
// quebrar a resposta — então o tipo aqui também fica em `string` livre.
export interface AnaliseIaRawToolCall {
  tool: string;
  args: Record<string, unknown> | null;
  output: unknown;
}

export type AnaliseIaRawData = Record<string, AnaliseIaRawToolCall[]>;

export interface AnaliseIaResultado {
  aprovado: boolean;
  motivo: string | null;
  // Só preenchidos por uma implementação que devolve parecer estruturado
  // (ver FlysakuraAnaliseIaAdapter) — o mock não popula.
  parecer?: string;
  flagsRisco?: string[];
  // Idem — detalhamento do cruzamento (stage3), null quando a resposta não
  // trouxer (ex.: mock, ou API antiga sem esse campo).
  detalhamento?: AnaliseIaDetalhamento | null;
  // Idem — verificação cadastral oficial (stage1), null quando a resposta
  // não trouxer (ex.: mock, focus sem "cadastral"/"completo", ou API antiga
  // sem esse campo).
  stage1?: AnaliseIaStage1 | null;
  // Idem — análise de crédito (stage2: AMAT/SOFIA/processos/reclamações),
  // null quando não executado (ver AnaliseIaStage2 acima).
  stage2?: AnaliseIaStage2 | null;
  // Idem — chamadas de tool brutas, só presentes quando `include_raw_data:
  // true` é mandado no request.
  rawData?: AnaliseIaRawData | null;
}

export interface AnaliseIaService {
  avaliar(input: AnaliseIaInput): Promise<AnaliseIaResultado>;
}
