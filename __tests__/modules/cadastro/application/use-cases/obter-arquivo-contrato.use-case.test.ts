import { ObterArquivoContratoUseCase } from "@/modules/cadastro/application/use-cases/obter-arquivo-contrato.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { Contrato } from "@/modules/cadastro/domain/entities/contrato.entity";
import type { ContratoRepository } from "@/modules/cadastro/domain/repositories/contrato-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";

function fakeContratoRepository(overrides: Partial<ContratoRepository> = {}): ContratoRepository {
  return {
    findById: jest.fn(),
    findByAgenciaId: jest.fn(),
    create: jest.fn(),
    atualizarStatus: jest.fn(),
    confirmarLeitura: jest.fn(),
    registrarAssinatura: jest.fn(),
    atualizarProvedorId: jest.fn(),
    ...overrides,
  };
}

function fakeContratoAssinaturaService(
  overrides: Partial<ContratoAssinaturaService> = {},
): ContratoAssinaturaService {
  return {
    gerarEEnviar: jest.fn(),
    visualizarDocumento: jest.fn(),
    obterDocumento: jest.fn(),
    obterDestinatarios: jest.fn(),
    registrarWebhook: jest.fn(),
    cancelarDocumento: jest.fn(),
    ...overrides,
  };
}

const CONTRATO = Contrato.create({
  id: "ct-1",
  agenciaId: "ag-1",
  provedorId: "doc-uuid-1",
  status: "aguardando_assinatura",
  origemGeracao: "ia",
  numContrato: null,
  conteudoPreenchido: null,
  leituraConfirmada: false,
  leituraConfirmadaPor: null,
  leituraConfirmadaEm: null,
  contratoGcsPath: null,
  pdfAssinadoGcsPath: null,
  assinadoAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("ObterArquivoContratoUseCase", () => {
  it("lança NotFoundError se o contrato não existe", async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(null),
    });
    const useCase = new ObterArquivoContratoUseCase(
      contratoRepository,
      fakeContratoAssinaturaService(),
    );

    await expect(useCase.execute("ct-inexistente")).rejects.toThrow(NotFoundError);
  });

  it("busca o arquivo no serviço de assinatura usando o provedorId do contrato", async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(CONTRATO),
    });
    const buffer = Buffer.from("%PDF-fake");
    const visualizarDocumento = jest
      .fn()
      .mockResolvedValue({ buffer, mimeType: "application/pdf" });
    const contratoAssinaturaService = fakeContratoAssinaturaService({ visualizarDocumento });
    const useCase = new ObterArquivoContratoUseCase(contratoRepository, contratoAssinaturaService);

    const resultado = await useCase.execute("ct-1");

    expect(visualizarDocumento).toHaveBeenCalledWith("doc-uuid-1");
    expect(resultado).toEqual({ buffer, mimeType: "application/pdf" });
  });
});
