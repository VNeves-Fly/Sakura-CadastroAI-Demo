export interface DocumentAnalysisInput {
  cnpj: string;
  documentPath: string;
  documentType: string;
  // Veredito da IA sobre o documento (default true, aplicado no adapter) —
  // ver FlysakuraDocumentAnalysisAdapter.
  includeVerdict?: boolean;
  // Busca em fonte oficial (Receita) pra comparar com o extraído (default
  // false). Só tem efeito real quando documentType === "contrato_social"
  // (único tipo com CNPJ pra buscar hoje — ver
  // docs/agency-analysis-params-tracking.md, Testes 1/3/3b) — nos outros
  // tipos a resposta sempre traz comparacaoOficial null.
  includeOfficialData?: boolean;
  // Dado que já temos (ex.: o que o cadastrante digitou no wizard) pra IA
  // cruzar contra o que ela extraiu do documento — ver Teste 2 na doc
  // acima. Divergência aparece só como texto livre em `alertas`, não em
  // campo estruturado.
  additionalData?: Record<string, unknown>;
}

export interface DocumentAnalysisChecagens {
  formatoValido: boolean;
  camposObrigatoriosPresentes: boolean;
  referenciaCruzadaOk: boolean;
  detalhes: Record<string, unknown>;
}

// Comparação de um campo entre o extraído do documento, a fonte oficial
// (quando existe) e o que foi fornecido (digitado ou já sabido) —
// reaproveitado tanto por `comparacao_oficial` (por documento, ver
// DocumentAnalysisResultado) quanto pelo `stage3`/detalhamento da avaliação
// final de agência (ver AnaliseIaDetalhamento, analise-ia-service.ts) —
// mesmo shape nos dois, confirmado nos testes documentados em
// docs/agency-analysis-params-tracking.md.
export interface AnaliseIaComparacaoCampo {
  campo: string;
  extraido: string | null;
  oficial: string | null;
  fornecido: string | null;
  confere: boolean | null;
}

export interface DocumentAnalysisResultado {
  camposExtraidos: Record<string, unknown>;
  camposExtras: Record<string, unknown>;
  confiancaExtracao: number;
  alertas: string[];
  resumoAnalise: string | null;
  textoBruto: string | null;
  checagens: DocumentAnalysisChecagens | null;
  // Veredito da IA sobre esse documento específico (independente do
  // veredito final de agência) — null quando include_verdict não foi
  // pedido, ou quando a resposta não trouxer o campo (ex.: mock).
  parecer?: string | null;
  // Comparação campo a campo com a fonte oficial — só populado quando
  // include_official_data foi pedido E documentType tem fonte oficial
  // disponível (hoje: só "contrato_social"). Null nos demais casos.
  comparacaoOficial?: AnaliseIaComparacaoCampo[] | null;
}

export interface DocumentAnalysisService {
  analisar(input: DocumentAnalysisInput): Promise<DocumentAnalysisResultado>;
}
