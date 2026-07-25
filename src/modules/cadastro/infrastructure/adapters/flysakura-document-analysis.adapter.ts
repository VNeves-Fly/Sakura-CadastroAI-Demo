import type {
  AnaliseIaComparacaoCampo,
  DocumentAnalysisInput,
  DocumentAnalysisResultado,
  DocumentAnalysisService,
} from "@/modules/cadastro/domain/services/document-analysis-service";

// Integração real com o agente de análise de documento da Sakura
// (https://agents.flysakura.com/redoc) — POST /api/v1/agency-analysis/documents/analyze/sync.
//
// Usa `internal_document_url` (gs://GCS_BUCKET_NAME/documentPath) em vez de assinar uma
// URL pública: o agents-service já tem IAM direto no bucket compartilhado, então não há
// necessidade de signed URL pra esse endpoint (diferente do FlysakuraAnaliseIaAdapter, que
// chama /agency-analysis/json e ainda depende de signed URLs).
//
// `session_id` é sempre o CNPJ: o mesmo valor é passado depois pro FlysakuraAnaliseIaAdapter
// (avaliação final), e como os dois endpoints compartilham o checkpoint do LangGraph por
// session_id, a análise final já enxerga o contexto de cada documento analisado aqui.
//
// Chamada "fire and forget" tolerante a falha — hoje serve só pra alimentar o contexto da
// sessão antes da avaliação final; nenhuma decisão de negócio depende do retorno ainda. Se o
// agente falhar ou responder algo não parseável, loga um aviso e devolve um resultado vazio
// em vez de interromper o cadastro.
//
// `include_verdict` (default true) e `include_official_data` (default false) são
// controláveis por chamada via DocumentAnalysisInput — nenhum call site precisa passar nada
// pra manter o comportamento de hoje. `include_official_data: true` só tem efeito real (gera
// `comparacaoOficial`) quando documentType === "contrato_social" (único tipo com CNPJ pra
// buscar hoje); nos demais tipos a resposta sempre traz esse campo null (confirmado em
// docs/agency-analysis-params-tracking.md).
function baseUrl(): string {
  return process.env.AGENCY_ANALYSIS_BASE_URL ?? "https://agents.flysakura.com";
}

const RESULTADO_VAZIO: DocumentAnalysisResultado = {
  camposExtraidos: {},
  camposExtras: {},
  confiancaExtracao: 0,
  alertas: [],
  resumoAnalise: null,
  textoBruto: null,
  checagens: null,
  parecer: null,
  comparacaoOficial: null,
};

export class FlysakuraDocumentAnalysisAdapter implements DocumentAnalysisService {
  async analisar(input: DocumentAnalysisInput): Promise<DocumentAnalysisResultado> {
    try {
      const response = await fetch(`${baseUrl()}/api/v1/agency-analysis/documents/analyze/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": requireApiKey(),
        },
        body: JSON.stringify({
          internal_document_url: `gs://${requireBucketName()}/${input.documentPath}`,
          document_type: input.documentType,
          session_id: input.cnpj,
          channel: "api",
          include_verdict: input.includeVerdict ?? true,
          include_official_data: input.includeOfficialData ?? false,
          additional_data: input.additionalData,
        }),
      });

      if (!response.ok) {
        console.warn(
          `document-analysis respondeu ${response.status} pra ${input.documentType} (cnpj=${input.cnpj})`,
        );
        return RESULTADO_VAZIO;
      }

      const data = (await response.json()) as {
        extracted_content?: {
          fields?: Record<string, unknown>;
          confidence_score?: number;
          raw_text?: string | null;
          extra_fields?: Record<string, unknown>;
        };
        observations?: string[];
        agent_analysis?: string;
        validation_checks?: {
          format_valid?: boolean;
          required_fields_present?: boolean;
          cross_reference_ok?: boolean | null;
          details?: Record<string, unknown>;
        };
        errors?: string[];
        parecer?: string | null;
        comparacao_oficial?: AnaliseIaComparacaoCampo[] | null;
      };

      if (data.errors?.length) {
        console.warn(
          `document-analysis retornou errors pra ${input.documentType} (cnpj=${input.cnpj}): ${data.errors.join("; ")}`,
        );
      }

      return {
        camposExtraidos: data.extracted_content?.fields ?? {},
        camposExtras: data.extracted_content?.extra_fields ?? {},
        confiancaExtracao: data.extracted_content?.confidence_score ?? 0,
        alertas: [
          ...(data.observations ?? []),
          ...(data.errors ?? []).map((erro) => `Erro: ${erro}`),
        ],
        resumoAnalise: data.agent_analysis ?? null,
        textoBruto: data.extracted_content?.raw_text ?? null,
        checagens: data.validation_checks
          ? {
              formatoValido: data.validation_checks.format_valid ?? false,
              camposObrigatoriosPresentes: data.validation_checks.required_fields_present ?? false,
              referenciaCruzadaOk: data.validation_checks.cross_reference_ok ?? false,
              detalhes: data.validation_checks.details ?? {},
            }
          : null,
        parecer: data.parecer ?? null,
        comparacaoOficial: data.comparacao_oficial ?? null,
      };
    } catch (error) {
      console.warn(
        `falha ao analisar documento ${input.documentType} (cnpj=${input.cnpj}): ${String(error)}`,
      );
      return RESULTADO_VAZIO;
    }
  }
}

function requireApiKey(): string {
  const apiKey = process.env.AGENCY_ANALYSIS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AGENCY_ANALYSIS_API_KEY não configurada — necessária para FlysakuraDocumentAnalysisAdapter.",
    );
  }
  return apiKey;
}

function requireBucketName(): string {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error(
      "GCS_BUCKET_NAME não configurada — necessária para montar internal_document_url.",
    );
  }
  return bucketName;
}
