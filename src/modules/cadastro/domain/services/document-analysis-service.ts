export interface DocumentAnalysisInput {
  cnpj: string;
  documentPath: string;
  documentType: string;
}

export interface DocumentAnalysisResultado {
  camposExtraidos: Record<string, unknown>;
  confiancaExtracao: number;
  alertas: string[];
}

export interface DocumentAnalysisService {
  analisar(input: DocumentAnalysisInput): Promise<DocumentAnalysisResultado>;
}
