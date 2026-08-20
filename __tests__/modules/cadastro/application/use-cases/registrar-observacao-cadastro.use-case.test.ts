import { RegistrarObservacaoCadastroUseCase } from "@/modules/cadastro/application/use-cases/registrar-observacao-cadastro.use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { ObservacaoCadastroRepository } from "@/modules/cadastro/domain/repositories/observacao-cadastro-repository";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { ObservacaoCadastro } from "@/modules/cadastro/domain/entities/observacao-cadastro.entity";

function criarMocks(agenciaEncontrada = true) {
  const observacaoCadastroRepository: ObservacaoCadastroRepository = {
    create: jest.fn().mockResolvedValue({ id: "obs-1" } as unknown as ObservacaoCadastro),
    findByAgenciaId: jest.fn(),
  };

  const agenciaRepository = {
    findById: jest
      .fn()
      .mockResolvedValue(agenciaEncontrada ? ({ id: "agencia-1" } as unknown as Agencia) : null),
  } as unknown as AgenciaRepository;

  return { observacaoCadastroRepository, agenciaRepository };
}

describe("RegistrarObservacaoCadastroUseCase", () => {
  it("registra a observação com o texto já sem espaços nas pontas", async () => {
    const { observacaoCadastroRepository, agenciaRepository } = criarMocks();
    const useCase = new RegistrarObservacaoCadastroUseCase(
      observacaoCadastroRepository,
      agenciaRepository,
    );

    await useCase.execute({
      agenciaId: "agencia-1",
      texto: "  cliente pediu pra ligar depois das 18h  ",
      registradoPor: "analista@example.com",
    });

    expect(observacaoCadastroRepository.create).toHaveBeenCalledWith({
      agenciaId: "agencia-1",
      texto: "cliente pediu pra ligar depois das 18h",
      registradoPor: "analista@example.com",
    });
  });

  it("lança NotFoundError quando a agência não existe", async () => {
    const { observacaoCadastroRepository, agenciaRepository } = criarMocks(false);
    const useCase = new RegistrarObservacaoCadastroUseCase(
      observacaoCadastroRepository,
      agenciaRepository,
    );

    await expect(
      useCase.execute({ agenciaId: "agencia-1", texto: "algo", registradoPor: "a@example.com" }),
    ).rejects.toThrow(NotFoundError);
  });

  it.each(["", "   "])("lança DomainError quando o texto é '%s' (vazio)", async (texto) => {
    const { observacaoCadastroRepository, agenciaRepository } = criarMocks();
    const useCase = new RegistrarObservacaoCadastroUseCase(
      observacaoCadastroRepository,
      agenciaRepository,
    );

    await expect(
      useCase.execute({ agenciaId: "agencia-1", texto, registradoPor: "a@example.com" }),
    ).rejects.toThrow(DomainError);
    expect(observacaoCadastroRepository.create).not.toHaveBeenCalled();
  });
});
