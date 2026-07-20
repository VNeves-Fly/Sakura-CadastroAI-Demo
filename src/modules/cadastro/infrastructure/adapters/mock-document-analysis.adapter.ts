import type {
  DocumentAnalysisInput,
  DocumentAnalysisResultado,
  DocumentAnalysisService,
} from "@/modules/cadastro/domain/services/document-analysis-service";

// Sem integração real ainda — ver FlysakuraDocumentAnalysisAdapter (mesma pasta) pra
// ativar quando AGENCY_ANALYSIS_API_KEY estiver configurada.
export class MockDocumentAnalysisService implements DocumentAnalysisService {
  async analisar(_input: DocumentAnalysisInput): Promise<DocumentAnalysisResultado> {
    return {
      camposExtraidos: {},
      camposExtras: {},
      confiancaExtracao: 0,
      alertas: [],
      resumoAnalise: null,
      textoBruto: null,
      checagens: null,
    };
  }
}
