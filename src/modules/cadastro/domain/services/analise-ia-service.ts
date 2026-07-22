import type { DocumentAnalysisResultado } from "@/modules/cadastro/domain/services/document-analysis-service";

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

// Um item do array `campos` dentro de cada bloco de documento em `stage3`
// — comparação de um campo entre o que foi extraído do documento, a fonte
// oficial (quando existe) e o que o cadastrante digitou no formulário.
export interface AnaliseIaComparacaoCampo {
  campo: string;
  extraido: string | null;
  oficial: string | null;
  fornecido: string | null;
  confere: boolean;
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

export interface AnaliseIaStage1 {
  situacaoCadastral: string | null;
  cnaePrincipal: AnaliseIaCnaePrincipal | null;
  razaoSocial: AnaliseIaCampoComparado | null;
  nomeFantasia: AnaliseIaCampoComparado | null;
  socios: AnaliseIaSociosComparados | null;
}

// Detalhamento do stage3 (cruzamento documental) devolvido pelo
// /agency-analysis/sync — usado pra dar contexto ao analista quando o
// parecer não é APROVADO, em vez de só "algo divergiu".
export interface AnaliseIaDetalhamento {
  documentosEmpresa: AnaliseIaDocumentoDetalhe[];
  socios: AnaliseIaSocioDetalhe[];
}

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
}

export interface AnaliseIaService {
  avaliar(input: AnaliseIaInput): Promise<AnaliseIaResultado>;
}
