import { ReenviarDocumentoUseCase } from "@/modules/cadastro/application/use-cases/reenviar-documento.use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";

const ARQUIVO = { buffer: Buffer.from("pdf"), originalName: "rg.pdf", mimeType: "application/pdf" };

function documentoReprovado(overrides: Partial<Record<string, unknown>> = {}): Documento {
  return {
    id: "doc-1",
    agenciaId: "agencia-1",
    representanteLegalId: "socio-1",
    tipo: "RG_CNPJ",
    status: "REPROVADO",
    ...overrides,
  } as unknown as Documento;
}

function criarMocks(documento: Documento) {
  const documentoRepository: DocumentoRepository = {
    findById: jest.fn().mockResolvedValue(documento),
    findByAgenciaId: jest.fn(),
    findByRepresentanteLegalId: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: "doc-2" }),
    atualizarStatus: jest.fn(),
  };

  const agenciaRepository: AgenciaRepository = {
    findByCnpj: jest.fn(),
    findById: jest.fn().mockResolvedValue({ cnpj: "62572350000180" } as unknown as Agencia),
    findByContratoProvedorId: jest.fn(),
    obterDetalhe: jest.fn(),
    create: jest.fn(),
    registrarAnaliseDocumento: jest.fn(),
    registrarAnaliseFinal: jest.fn(),
    atualizarStatus: jest.fn(),
    atualizarDadosCadastrais: jest.fn(),
    salvarSica: jest.fn(),
    salvarTravelLink: jest.fn(),
    criarContrato: jest.fn(),
    atualizarStatusContrato: jest.fn(),
    listar: jest.fn(),
    obterKpis: jest.fn(),
    obterAnaliseContratos: jest.fn(),
    listarPorExecutivoId: jest.fn(),
  };

  const save = jest.fn((_arquivo: unknown, pathHint: string) =>
    Promise.resolve({ path: `${pathHint}.pdf`, bucket: "b" }),
  );
  const fileStorage: FileStorage = { save };

  return { documentoRepository, agenciaRepository, fileStorage };
}

describe("ReenviarDocumentoUseCase", () => {
  it("nunca reutiliza o mesmo path entre reenvios diferentes, mesmo pro mesmo sócio/tipo", async () => {
    const { documentoRepository, agenciaRepository, fileStorage } =
      criarMocks(documentoReprovado());
    const useCase = new ReenviarDocumentoUseCase(
      documentoRepository,
      agenciaRepository,
      fileStorage,
    );

    await useCase.execute({ agenciaId: "agencia-1", documentoId: "doc-1", arquivo: ARQUIVO });
    await useCase.execute({ agenciaId: "agencia-1", documentoId: "doc-1", arquivo: ARQUIVO });

    const paths = (fileStorage.save as jest.Mock).mock.calls.map(([, pathHint]) => pathHint);
    expect(paths[0]).not.toBe(paths[1]);
    expect(paths[0]).toMatch(/^agencias\/62572350000180\/reenvio-rg_cnpj-socio-1-.+$/);
    expect(paths[1]).toMatch(/^agencias\/62572350000180\/reenvio-rg_cnpj-socio-1-.+$/);
  });

  it("distingue sócios diferentes reenviando o mesmo tipo de documento", async () => {
    const { documentoRepository, agenciaRepository, fileStorage } = criarMocks(
      documentoReprovado({ representanteLegalId: "socio-2" }),
    );
    const useCase = new ReenviarDocumentoUseCase(
      documentoRepository,
      agenciaRepository,
      fileStorage,
    );

    await useCase.execute({ agenciaId: "agencia-1", documentoId: "doc-1", arquivo: ARQUIVO });

    const [, pathHint] = (fileStorage.save as jest.Mock).mock.calls[0];
    expect(pathHint).toContain("socio-2");
  });

  it("lança NotFoundError se o documento não existe ou é de outra agência", async () => {
    const { documentoRepository, agenciaRepository, fileStorage } = criarMocks(
      documentoReprovado({ agenciaId: "outra-agencia" }),
    );
    const useCase = new ReenviarDocumentoUseCase(
      documentoRepository,
      agenciaRepository,
      fileStorage,
    );

    await expect(
      useCase.execute({ agenciaId: "agencia-1", documentoId: "doc-1", arquivo: ARQUIVO }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lança ConflictError se o documento não está reprovado", async () => {
    const { documentoRepository, agenciaRepository, fileStorage } = criarMocks(
      documentoReprovado({ status: "PENDENTE" }),
    );
    const useCase = new ReenviarDocumentoUseCase(
      documentoRepository,
      agenciaRepository,
      fileStorage,
    );

    await expect(
      useCase.execute({ agenciaId: "agencia-1", documentoId: "doc-1", arquivo: ARQUIVO }),
    ).rejects.toThrow(ConflictError);
  });
});
