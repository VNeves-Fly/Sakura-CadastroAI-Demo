import { ReanalisarDocumentoUseCase } from "@/modules/cadastro/application/use-cases/reanalisar-documento.use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";

function documentoReprovado(overrides: Partial<Record<string, unknown>> = {}): Documento {
  return {
    id: "doc-1",
    agenciaId: "agencia-1",
    representanteLegalId: "socio-1",
    tipo: "RG_CNPJ",
    fileName: "rg.pdf",
    mimeType: "application/pdf",
    descricaoOutro: null,
    gcsPath: "agencias/62572350000180/manual-rg_cnpj-socio-1-abc.pdf",
    gcsBucket: "b",
    gcsSize: 1234,
    gcsMd5: "md5-hash",
    status: "REPROVADO",
    ...overrides,
  } as unknown as Documento;
}

function criarMocks(documento: Documento | null) {
  const documentoRepository: DocumentoRepository = {
    findById: jest.fn().mockResolvedValue(documento),
    findByAgenciaId: jest.fn(),
    findByRepresentanteLegalId: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: "doc-2", status: "PENDENTE" }),
    atualizarStatus: jest.fn(),
  };

  return { documentoRepository };
}

describe("ReanalisarDocumentoUseCase", () => {
  it("cria uma linha nova reaproveitando o mesmo arquivo, sem sobrescrever o reprovado", async () => {
    const { documentoRepository } = criarMocks(documentoReprovado());
    const useCase = new ReanalisarDocumentoUseCase(documentoRepository);

    await useCase.execute({ documentoId: "doc-1", reanalisadoPor: "analista@sakura.com" });

    expect(documentoRepository.create).toHaveBeenCalledWith({
      agenciaId: "agencia-1",
      representanteLegalId: "socio-1",
      tipo: "RG_CNPJ",
      fileName: "rg.pdf",
      mimeType: "application/pdf",
      descricaoOutro: null,
      gcsPath: "agencias/62572350000180/manual-rg_cnpj-socio-1-abc.pdf",
      gcsBucket: "b",
      gcsSize: 1234,
      gcsMd5: "md5-hash",
      inseridoManualmentePor: "analista@sakura.com",
    });
    // A linha antiga nunca é tocada — nem atualizarStatus nem create
    // recebem o id do documento reprovado, só o findById de leitura.
    expect(documentoRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it("lança NotFoundError se o documento não existe", async () => {
    const { documentoRepository } = criarMocks(null);
    const useCase = new ReanalisarDocumentoUseCase(documentoRepository);

    await expect(
      useCase.execute({ documentoId: "doc-1", reanalisadoPor: "analista@sakura.com" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lança ConflictError se o documento não está reprovado", async () => {
    const { documentoRepository } = criarMocks(documentoReprovado({ status: "APROVADO" }));
    const useCase = new ReanalisarDocumentoUseCase(documentoRepository);

    await expect(
      useCase.execute({ documentoId: "doc-1", reanalisadoPor: "analista@sakura.com" }),
    ).rejects.toThrow(ConflictError);
  });
});
