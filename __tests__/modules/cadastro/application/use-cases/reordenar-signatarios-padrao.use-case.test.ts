import { ReordenarSignatariosPadraoUseCase } from "@/modules/cadastro/application/use-cases/reordenar-signatarios-padrao.use-case";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";
import { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import { DomainError } from "@/modules/shared/domain/errors";

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
    findAtivos: jest
      .fn()
      .mockResolvedValue([signatario("a", 1), signatario("b", 2), signatario("c", 3)]),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restaurar: jest.fn(),
    reordenar: jest.fn(),
    ...overrides,
  };
}

describe("ReordenarSignatariosPadraoUseCase", () => {
  it("persiste a nova ordem quando os ids batem exatamente com os ativos atuais", async () => {
    const repository = fakeRepository();
    const useCase = new ReordenarSignatariosPadraoUseCase(repository);

    await useCase.execute(["c", "a", "b"]);

    expect(repository.reordenar).toHaveBeenCalledWith(["c", "a", "b"]);
  });

  it("lança DomainError se faltar um id ativo na lista enviada", async () => {
    const repository = fakeRepository();
    const useCase = new ReordenarSignatariosPadraoUseCase(repository);

    await expect(useCase.execute(["a", "b"])).rejects.toThrow(DomainError);
    expect(repository.reordenar).not.toHaveBeenCalled();
  });

  it("lança DomainError se vier um id que não é (mais) ativo", async () => {
    const repository = fakeRepository();
    const useCase = new ReordenarSignatariosPadraoUseCase(repository);

    await expect(useCase.execute(["a", "b", "removido-por-fora"])).rejects.toThrow(DomainError);
    expect(repository.reordenar).not.toHaveBeenCalled();
  });

  it("lança DomainError se a lista enviada tiver ids duplicados", async () => {
    const repository = fakeRepository();
    const useCase = new ReordenarSignatariosPadraoUseCase(repository);

    await expect(useCase.execute(["a", "a", "b"])).rejects.toThrow(DomainError);
    expect(repository.reordenar).not.toHaveBeenCalled();
  });
});
