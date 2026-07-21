import { FlysakuraAnaliseIaAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter";
import type { AnaliseIaInput } from "@/modules/cadastro/domain/services/analise-ia-service";

const originalEnv = process.env;

const input: AnaliseIaInput = {
  cnpj: "19131243000197",
  razaoSocial: "Agência Teste",
  email: "contato@agenciateste.com",
  socios: [
    {
      nome: "Fulano de Tal",
      cpf: "39053344705",
      dataNascimento: "1990-04-12",
      rgPath: "cadastro-ai/agencias/x/socio-0-rg.pdf",
      rgAnalise: {
        camposExtraidos: { nome: "Fulano de Tal", cpf: "390.533.447-05" },
        camposExtras: {},
        confiancaExtracao: 0.97,
        alertas: [],
        resumoAnalise: null,
        textoBruto: null,
        checagens: null,
      },
    },
  ],
};

describe("FlysakuraAnaliseIaAdapter", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AGENCY_ANALYSIS_API_KEY: "secret-teste",
      AGENCY_ANALYSIS_BASE_URL: "https://agente.teste",
      GCS_BUCKET_NAME: "bucket-teste",
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("monta o payload certo pro agente, reaproveitando o resultado já extraído na etapa 3", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ parecer: "APROVADO", justificativa: "", flags_risco: [] }),
    });

    const resultado = await new FlysakuraAnaliseIaAdapter().avaliar(input);

    expect(resultado).toEqual({
      aprovado: true,
      motivo: null,
      parecer: "APROVADO",
      flagsRisco: [],
    });

    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://agente.teste/api/v1/agency-analysis/json");
    expect(opts.headers["X-Internal-Secret"]).toBe("secret-teste");
    expect(JSON.parse(opts.body)).toEqual({
      cnpj: "19131243000197",
      channel: "api",
      language: "pt-br",
      session_id: "19131243000197",
      analysis_data: {
        cnpj: "19131243000197",
        focus: "completo",
        verificar_processos: false,
        verificar_amat: false,
        razao_social: "Agência Teste",
        email: "contato@agenciateste.com",
        socios: [
          {
            nome: "Fulano de Tal",
            documento_identificacao: "39053344705",
            data_nascimento: "1990-04-12",
            documentos: [
              {
                internal_document_url: "gs://bucket-teste/cadastro-ai/agencias/x/socio-0-rg.pdf",
                document_type: "doc_identificacao",
                campos_extraidos: { nome: "Fulano de Tal", cpf: "390.533.447-05" },
                confidence_score: 0.97,
                alertas: [],
              },
            ],
          },
        ],
      },
    });
  });

  it("mapeia PENDENTE/REPROVADO/null como não aprovado, usando a justificativa como motivo", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        parecer: "REPROVADO",
        justificativa: "CNAE incompatível com agência de viagem",
        flags_risco: ["cnae_incompativel"],
      }),
    });

    const resultado = await new FlysakuraAnaliseIaAdapter().avaliar(input);

    expect(resultado).toEqual({
      aprovado: false,
      motivo: "CNAE incompatível com agência de viagem",
      parecer: "REPROVADO",
      flagsRisco: ["cnae_incompativel"],
    });
  });

  it("lança erro descritivo quando o agente responde erro (ex: 'agent_execution_failed')", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '{"detail":"agent_execution_failed"}',
    });

    await expect(new FlysakuraAnaliseIaAdapter().avaliar(input)).rejects.toThrow(
      'agency-analysis respondeu 500: {"detail":"agent_execution_failed"}',
    );
  });

  it("lança erro claro se AGENCY_ANALYSIS_API_KEY não está configurada", async () => {
    delete process.env.AGENCY_ANALYSIS_API_KEY;

    await expect(new FlysakuraAnaliseIaAdapter().avaliar(input)).rejects.toThrow(
      "AGENCY_ANALYSIS_API_KEY não configurada",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("lança erro claro se GCS_BUCKET_NAME não está configurada (necessária pra montar internal_document_url)", async () => {
    delete process.env.GCS_BUCKET_NAME;

    await expect(new FlysakuraAnaliseIaAdapter().avaliar(input)).rejects.toThrow(
      "GCS_BUCKET_NAME não configurada",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
