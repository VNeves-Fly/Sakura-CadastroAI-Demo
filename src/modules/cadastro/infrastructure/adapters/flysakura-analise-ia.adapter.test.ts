// Declarados dentro da factory (ver mesmo comentário em
// gcs-file-storage.adapter.test.ts) — recuperados depois via jest.requireMock.
jest.mock("@google-cloud/storage", () => {
  const mockGetSignedUrl = jest.fn();
  const mockFile = jest.fn().mockReturnValue({ getSignedUrl: mockGetSignedUrl });
  const mockBucket = jest.fn().mockReturnValue({ file: mockFile });
  return {
    Storage: jest.fn().mockImplementation(() => ({ bucket: mockBucket })),
    __mockGcs: { mockGetSignedUrl, mockFile, mockBucket },
  };
});

import { FlysakuraAnaliseIaAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-analise-ia.adapter";

const { mockGetSignedUrl, mockBucket } = (
  jest.requireMock("@google-cloud/storage") as unknown as {
    __mockGcs: { mockGetSignedUrl: jest.Mock; mockFile: jest.Mock; mockBucket: jest.Mock };
  }
).__mockGcs;
import type { AnaliseIaInput } from "@/modules/cadastro/domain/services/analise-ia-service";

const originalEnv = process.env;

const input: AnaliseIaInput = {
  cnpj: "19131243000197",
  razaoSocial: "Agência Teste",
  contratoSocialPath: "cadastro-ai/agencias/x/contrato-social.pdf",
  socios: [
    {
      nome: "Fulano de Tal",
      cpf: "39053344705",
      rgPath: "cadastro-ai/agencias/x/socio-0-rg.pdf",
      procuracaoPath: "cadastro-ai/agencias/x/socio-0-procuracao.pdf",
    },
  ],
};

describe("FlysakuraAnaliseIaAdapter", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AGENCY_ANALYSIS_API_KEY: "secret-teste",
      GCS_BUCKET_NAME: "bucket-teste",
      AGENCY_ANALYSIS_BASE_URL: "https://agente.teste",
    };
    global.fetch = jest.fn();
    mockGetSignedUrl.mockResolvedValue(["https://signed-url.exemplo/arquivo.pdf"]);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("assina os documentos no GCS e monta o payload certo pro agente", async () => {
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

    expect(mockBucket).toHaveBeenCalledWith("bucket-teste");
    // contrato social + rg + procuração do sócio = 3 assinaturas
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(3);
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({ action: "read", expires: expect.any(Number) }),
    );

    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://agente.teste/api/v1/agency-analysis/json");
    expect(opts.headers["X-Internal-Secret"]).toBe("secret-teste");
    expect(JSON.parse(opts.body)).toEqual({
      cnpj: "19131243000197",
      company_name: "Agência Teste",
      partners: [
        {
          name: "Fulano de Tal",
          document: "39053344705",
          attachments: [
            "https://signed-url.exemplo/arquivo.pdf",
            "https://signed-url.exemplo/arquivo.pdf",
          ],
        },
      ],
      documents: ["https://signed-url.exemplo/arquivo.pdf"],
      analysis_data: { cnpj: "19131243000197", focus: "completo" },
      include_receita_data: false,
      raw: false,
      session_id: "19131243000197",
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

  it("não assina anexo de procuração quando o sócio não tem procuração", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ parecer: "APROVADO", justificativa: "", flags_risco: [] }),
    });

    await new FlysakuraAnaliseIaAdapter().avaliar({
      ...input,
      socios: [{ ...input.socios[0]!, procuracaoPath: null }],
    });

    // contrato social + rg (sem procuração) = 2 assinaturas
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(2);
  });

  it("lança erro descritivo quando o agente responde erro (ex: instabilidade real observada — 'agent_execution_failed')", async () => {
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
  });

  it("lança erro claro se GCS_BUCKET_NAME não está configurada (necessária pra assinar os documentos)", async () => {
    delete process.env.GCS_BUCKET_NAME;

    await expect(new FlysakuraAnaliseIaAdapter().avaliar(input)).rejects.toThrow(
      "GCS_BUCKET_NAME não configurada",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
