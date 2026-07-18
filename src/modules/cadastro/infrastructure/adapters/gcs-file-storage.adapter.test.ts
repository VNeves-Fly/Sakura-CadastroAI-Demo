// Declarados dentro da factory (não como const de topo de arquivo)
// porque jest.mock() é hoisted acima de qualquer `const` do arquivo — um
// mock referenciado de fora ainda não estaria inicializado nesse ponto.
// Recuperamos as mesmas instâncias depois via jest.requireMock.
jest.mock("@google-cloud/storage", () => {
  const mockSave = jest.fn().mockResolvedValue(undefined);
  const mockFile = jest.fn().mockReturnValue({ save: mockSave });
  const mockBucket = jest.fn().mockReturnValue({ file: mockFile });
  return {
    Storage: jest.fn().mockImplementation(() => ({ bucket: mockBucket })),
    __mockGcs: { mockSave, mockFile, mockBucket },
  };
});

import { GcsFileStorage } from "@/modules/cadastro/infrastructure/adapters/gcs-file-storage.adapter";

const { mockSave, mockFile, mockBucket } = (
  jest.requireMock("@google-cloud/storage") as unknown as {
    __mockGcs: { mockSave: jest.Mock; mockFile: jest.Mock; mockBucket: jest.Mock };
  }
).__mockGcs;

const originalEnv = process.env;
const arquivo = {
  buffer: Buffer.from("conteudo do arquivo"),
  originalName: "documento.pdf",
  mimeType: "application/pdf",
};

describe("GcsFileStorage", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it("sobe o arquivo no bucket informado, com pathHint + timestamp + extensão", async () => {
    const storage = new GcsFileStorage("meu-bucket", "");
    const path = await storage.save(arquivo, "agencias/123/contrato-social");

    expect(mockBucket).toHaveBeenCalledWith("meu-bucket");
    expect(mockFile).toHaveBeenCalledWith(
      expect.stringMatching(/^agencias\/123\/contrato-social-\d+\.pdf$/),
    );
    expect(mockSave).toHaveBeenCalledWith(arquivo.buffer, { contentType: "application/pdf" });
    expect(path).toMatch(/^agencias\/123\/contrato-social-\d+\.pdf$/);
  });

  it("prefixa o path com folderPrefix quando configurado", async () => {
    const storage = new GcsFileStorage("meu-bucket", "cadastro-ai");
    const path = await storage.save(arquivo, "agencias/123/rg");

    expect(path).toMatch(/^cadastro-ai\/agencias\/123\/rg-\d+\.pdf$/);
  });

  it("usa GCS_BUCKET_NAME e GCS_FOLDER_PREFIX do ambiente quando não passados no construtor", async () => {
    process.env = {
      ...originalEnv,
      GCS_BUCKET_NAME: "bucket-do-env",
      GCS_FOLDER_PREFIX: "prefixo-env",
    };

    const storage = new GcsFileStorage();
    const path = await storage.save(arquivo, "x");

    expect(mockBucket).toHaveBeenCalledWith("bucket-do-env");
    expect(path).toMatch(/^prefixo-env\/x-\d+\.pdf$/);
  });

  it("lança erro claro se GCS_BUCKET_NAME não está configurada e nenhum bucketName foi passado", () => {
    process.env = { ...originalEnv };
    delete process.env.GCS_BUCKET_NAME;

    expect(() => new GcsFileStorage()).toThrow("GCS_BUCKET_NAME não configurada");
  });

  it("propaga o erro se o upload falhar", async () => {
    mockSave.mockRejectedValueOnce(new Error("network down"));
    const storage = new GcsFileStorage("meu-bucket");

    await expect(storage.save(arquivo, "x")).rejects.toThrow("network down");
  });
});
