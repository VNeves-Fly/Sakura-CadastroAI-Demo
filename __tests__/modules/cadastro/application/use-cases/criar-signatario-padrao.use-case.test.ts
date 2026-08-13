import { CriarSignatarioPadraoUseCase } from "@/modules/cadastro/application/use-cases/criar-signatario-padrao.use-case";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";
import { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";

function signatario(id: string, estagio: number): SignatarioPadrao {
  return SignatarioPadrao.create({
    id,
    nome: `Signatário ${id}`,
    cargo: null,
    email: `${id}@sakuratur.com.br`,
    telefone: null,
    deletedAt: null,
    ordem: null,
    papel: "ASSINAR_COMO_PARTE",
    estagio,
  });
}

function fakeRepository(
  overrides: Partial<SignatarioPadraoRepository> = {},
): SignatarioPadraoRepository {
  return {
    findAll: jest.fn(),
    findAtivos: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    create: jest
      .fn()
      .mockImplementation((data) => Promise.resolve(signatario("novo", data.estagio))),
    update: jest.fn(),
    softDelete: jest.fn(),
    restaurar: jest.fn(),
    reordenar: jest.fn(),
    ...overrides,
  };
}

describe("CriarSignatarioPadraoUseCase", () => {
  it("cria no estágio 1 quando não há nenhum signatário ativo", async () => {
    const repository = fakeRepository({ findAtivos: jest.fn().mockResolvedValue([]) });
    const useCase = new CriarSignatarioPadraoUseCase(repository);

    await useCase.execute({ nome: "Fulano", email: "fulano@sakuratur.com.br", papel: "APROVAR" });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "Fulano", papel: "APROVAR", estagio: 1 }),
    );
  });

  it("entra sempre no fim da fila (maior estágio ativo + 1), mesmo com gaps", async () => {
    const repository = fakeRepository({
      findAtivos: jest.fn().mockResolvedValue([signatario("a", 1), signatario("b", 4)]),
    });
    const useCase = new CriarSignatarioPadraoUseCase(repository);

    await useCase.execute({ nome: "Cicrana", email: "cicrana@sakuratur.com.br", papel: "ASSINAR" });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ estagio: 5 }));
  });
});
