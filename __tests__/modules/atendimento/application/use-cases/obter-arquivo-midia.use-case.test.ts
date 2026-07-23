import { ObterArquivoMidiaUseCase } from "@/modules/atendimento/application/use-cases/obter-arquivo-midia.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { DocumentoArquivoService } from "@/modules/cadastro/domain/services/documento-arquivo-service";
import type {
  MensagemRepository,
  MidiaArmazenada,
} from "@/modules/atendimento/domain/repositories/mensagem-repository";

function criarMensagemRepositoryFake(midia: MidiaArmazenada | null): MensagemRepository {
  return {
    create: jest.fn(),
    criarMidia: jest.fn(),
    findMidiaById: jest.fn().mockResolvedValue(midia),
    marcarClienteComoLidas: jest.fn(),
    findByWaMessageId: jest.fn(),
    atualizarStatusPorWaMessageId: jest.fn(),
  };
}

describe("ObterArquivoMidiaUseCase", () => {
  it("lança NotFoundError se o id de mídia não existe", async () => {
    const mensagemRepository = criarMensagemRepositoryFake(null);
    const documentoArquivoService: DocumentoArquivoService = { obter: jest.fn() };
    const useCase = new ObterArquivoMidiaUseCase(mensagemRepository, documentoArquivoService);

    await expect(useCase.execute("midia-inexistente")).rejects.toThrow(NotFoundError);
    expect(documentoArquivoService.obter).not.toHaveBeenCalled();
  });

  it("resolve o path/bucket salvos via DocumentoArquivoService e usa o fileName salvo", async () => {
    const mensagemRepository = criarMensagemRepositoryFake({
      gcsPath: "atendimento/conv-1/foto.jpg",
      gcsBucket: "meu-bucket",
      mimeType: "image/jpeg",
      fileName: "foto-original.jpg",
    });
    const documentoArquivoService: DocumentoArquivoService = {
      obter: jest
        .fn()
        .mockResolvedValue({ tipo: "buffer", buffer: Buffer.from("x"), mimeType: "image/jpeg" }),
    };
    const useCase = new ObterArquivoMidiaUseCase(mensagemRepository, documentoArquivoService);

    const { resultado, fileName } = await useCase.execute("midia-1");

    expect(documentoArquivoService.obter).toHaveBeenCalledWith(
      "atendimento/conv-1/foto.jpg",
      "meu-bucket",
    );
    expect(fileName).toBe("foto-original.jpg");
    expect(resultado).toEqual({ tipo: "buffer", buffer: Buffer.from("x"), mimeType: "image/jpeg" });
  });

  it("usa o último segmento do path como fileName quando não há fileName salvo", async () => {
    const mensagemRepository = criarMensagemRepositoryFake({
      gcsPath: "atendimento/conv-1/media-meta-123.jpg",
      gcsBucket: null,
      mimeType: "image/jpeg",
      fileName: null,
    });
    const documentoArquivoService: DocumentoArquivoService = {
      obter: jest.fn().mockResolvedValue({ tipo: "redirect", url: "https://storage/signed-url" }),
    };
    const useCase = new ObterArquivoMidiaUseCase(mensagemRepository, documentoArquivoService);

    const { fileName } = await useCase.execute("midia-1");

    expect(fileName).toBe("media-meta-123.jpg");
  });
});
