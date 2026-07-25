import { FlysakuraDocumentAnalysisAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-document-analysis.adapter";
import type { DocumentAnalysisInput } from "@/modules/cadastro/domain/services/document-analysis-service";

const originalEnv = process.env;

const input: DocumentAnalysisInput = {
  cnpj: "19131243000197",
  documentPath: "cadastro-ai/agencias/19131243000197/contrato-social-123.pdf",
  documentType: "contrato_social",
};

describe("FlysakuraDocumentAnalysisAdapter", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AGENCY_ANALYSIS_API_KEY: "secret-teste",
      GCS_BUCKET_NAME: "bucket-teste",
      AGENCY_ANALYSIS_BASE_URL: "https://agente.teste",
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("monta internal_document_url (gs://) e session_id=cnpj, sem assinar URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        extracted_content: { fields: { cnpj: input.cnpj }, confidence_score: 0.92 },
        observations: ["ALERT_CRITICAL: campo capital_social ausente"],
        agent_analysis: "O contrato social apresenta a maioria dos campos esperados.",
        validation_checks: {
          format_valid: true,
          required_fields_present: false,
          cross_reference_ok: false,
          details: { page_count_valid: true, text_extracted: true },
        },
      }),
    });

    const resultado = await new FlysakuraDocumentAnalysisAdapter().analisar(input);

    expect(resultado).toEqual({
      camposExtraidos: { cnpj: input.cnpj },
      camposExtras: {},
      confiancaExtracao: 0.92,
      alertas: ["ALERT_CRITICAL: campo capital_social ausente"],
      resumoAnalise: "O contrato social apresenta a maioria dos campos esperados.",
      textoBruto: null,
      checagens: {
        formatoValido: true,
        camposObrigatoriosPresentes: false,
        referenciaCruzadaOk: false,
        detalhes: { page_count_valid: true, text_extracted: true },
      },
      parecer: null,
      comparacaoOficial: null,
    });

    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://agente.teste/api/v1/agency-analysis/documents/analyze/sync");
    expect(opts.headers["X-Internal-Secret"]).toBe("secret-teste");
    expect(JSON.parse(opts.body)).toEqual({
      internal_document_url:
        "gs://bucket-teste/cadastro-ai/agencias/19131243000197/contrato-social-123.pdf",
      document_type: "contrato_social",
      session_id: "19131243000197",
      channel: "api",
      include_verdict: true,
      include_official_data: false,
    });
  });

  it("aceita includeVerdict/includeOfficialData/additionalData explícitos, sobrescrevendo os defaults", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ extracted_content: { fields: {} } }),
    });

    await new FlysakuraDocumentAnalysisAdapter().analisar({
      ...input,
      includeVerdict: false,
      includeOfficialData: true,
      additionalData: { nome: "Fulano de Tal", cpf: "39053344705" },
    });

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(opts.body)).toEqual({
      internal_document_url:
        "gs://bucket-teste/cadastro-ai/agencias/19131243000197/contrato-social-123.pdf",
      document_type: "contrato_social",
      session_id: "19131243000197",
      channel: "api",
      include_verdict: false,
      include_official_data: true,
      additional_data: { nome: "Fulano de Tal", cpf: "39053344705" },
    });
  });

  it("mapeia parecer e comparacaoOficial da resposta (ver docs/agency-analysis-params-tracking.md)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        extracted_content: { fields: { cnpj: "31635283000171" }, confidence_score: 1 },
        parecer: "APROVADO",
        comparacao_oficial: [
          {
            campo: "cnpj",
            extraido: "31.635.283/0001-71",
            oficial: "31635283000171",
            fornecido: null,
            confere: true,
          },
          {
            campo: "natureza_juridica",
            extraido: null,
            oficial: "Sociedade Empresária Limitada",
            fornecido: null,
            confere: null,
          },
        ],
      }),
    });

    const resultado = await new FlysakuraDocumentAnalysisAdapter().analisar({
      ...input,
      includeOfficialData: true,
    });

    expect(resultado.parecer).toBe("APROVADO");
    expect(resultado.comparacaoOficial).toEqual([
      {
        campo: "cnpj",
        extraido: "31.635.283/0001-71",
        oficial: "31635283000171",
        fornecido: null,
        confere: true,
      },
      {
        campo: "natureza_juridica",
        extraido: null,
        oficial: "Sociedade Empresária Limitada",
        fornecido: null,
        confere: null,
      },
    ]);
  });

  it("devolve resultado vazio (sem lançar) quando o agente responde erro", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

    const resultado = await new FlysakuraDocumentAnalysisAdapter().analisar(input);

    expect(resultado).toEqual({
      camposExtraidos: {},
      camposExtras: {},
      confiancaExtracao: 0,
      alertas: [],
      resumoAnalise: null,
      textoBruto: null,
      checagens: null,
      parecer: null,
      comparacaoOficial: null,
    });
  });

  it("devolve resultado vazio (sem lançar) quando o corpo da resposta não é JSON válido", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });

    const resultado = await new FlysakuraDocumentAnalysisAdapter().analisar(input);

    expect(resultado).toEqual({
      camposExtraidos: {},
      camposExtras: {},
      confiancaExtracao: 0,
      alertas: [],
      resumoAnalise: null,
      textoBruto: null,
      checagens: null,
      parecer: null,
      comparacaoOficial: null,
    });
  });

  it("devolve resultado vazio (sem lançar) se AGENCY_ANALYSIS_API_KEY não está configurada", async () => {
    delete process.env.AGENCY_ANALYSIS_API_KEY;

    const resultado = await new FlysakuraDocumentAnalysisAdapter().analisar(input);

    expect(resultado).toEqual({
      camposExtraidos: {},
      camposExtras: {},
      confiancaExtracao: 0,
      alertas: [],
      resumoAnalise: null,
      textoBruto: null,
      checagens: null,
      parecer: null,
      comparacaoOficial: null,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
