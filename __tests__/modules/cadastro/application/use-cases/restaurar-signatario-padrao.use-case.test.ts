import { RestaurarSignatarioPadraoUseCase } from "@/modules/cadastro/application/use-cases/restaurar-signatario-padrao.use-case";
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
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restaurar: jest.fn(),
    reordenar: jest.fn(),
    ...overrides,
  };
}

describe("RestaurarSignatarioPadraoUseCase", () => {
  it("limpa o deletedAt e manda pro fim da fila atual, não devolve pro estágio antigo", async () => {
    const repository = fakeRepository({
      findAtivos: jest.fn().mockResolvedValue([signatario("a", 1), signatario("b", 2)]),
    });
    const useCase = new RestaurarSignatarioPadraoUseCase(repository);

    await useCase.execute("removido-1");

    expect(repository.restaurar).toHaveBeenCalledWith("removido-1");
    expect(repository.update).toHaveBeenCalledWith("removido-1", { estagio: 3 });
  });

  it("manda pro estágio 1 quando não sobrou nenhum ativo", async () => {
    const repository = fakeRepository({ findAtivos: jest.fn().mockResolvedValue([]) });
    const useCase = new RestaurarSignatarioPadraoUseCase(repository);

    await useCase.execute("removido-1");

    expect(repository.update).toHaveBeenCalledWith("removido-1", { estagio: 1 });
  });
});
