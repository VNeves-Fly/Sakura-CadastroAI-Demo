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

export interface AnaliseIaResultado {
  aprovado: boolean;
  motivo: string | null;
  // Só preenchidos por uma implementação que devolve parecer estruturado
  // (ver FlysakuraAnaliseIaAdapter) — o mock não popula.
  parecer?: string;
  flagsRisco?: string[];
}

export interface AnaliseIaService {
  avaliar(input: AnaliseIaInput): Promise<AnaliseIaResultado>;
}
