export interface DocumentAnalysisInput {
  cnpj: string;
  documentPath: string;
  documentType: string;
}

export interface DocumentAnalysisChecagens {
  formatoValido: boolean;
  camposObrigatoriosPresentes: boolean;
  referenciaCruzadaOk: boolean;
  detalhes: Record<string, unknown>;
}

export interface DocumentAnalysisResultado {
  camposExtraidos: Record<string, unknown>;
  camposExtras: Record<string, unknown>;
  confiancaExtracao: number;
  alertas: string[];
  resumoAnalise: string | null;
  textoBruto: string | null;
  checagens: DocumentAnalysisChecagens | null;
}

export interface DocumentAnalysisService {
  analisar(input: DocumentAnalysisInput): Promise<DocumentAnalysisResultado>;
}
