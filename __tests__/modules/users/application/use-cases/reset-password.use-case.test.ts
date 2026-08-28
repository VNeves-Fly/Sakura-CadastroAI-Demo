import { ResetPasswordUseCase } from "@/modules/users/application/use-cases/reset-password.use-case";
import { hashPasswordResetValue } from "@/modules/users/utils/password-reset-hash.util";
import { DomainError } from "@/modules/shared/domain/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type {
  PasswordResetRecord,
  PasswordResetRepository,
} from "@/modules/users/domain/repositories/password-reset-repository";
import type { PasswordHasher } from "@/modules/users/domain/services/password-hasher";

const TOKEN = "raw-token";

function fakeRecord(overrides: Partial<PasswordResetRecord> = {}): PasswordResetRecord {
  return {
    id: "reset-1",
    userId: "user-1",
    tokenHash: hashPasswordResetValue(TOKEN),
    codigoHash: "irrelevante-aqui",
    status: "VERIFIED",
    tentativas: 0,
    verificadoEm: new Date(),
    usadoEm: null,
    expiraEm: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

function criarMocks(record: PasswordResetRecord | null) {
  const userRepository: UserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    updatePassword: jest.fn(),
  };

  const passwordResetRepository: PasswordResetRepository = {
    create: jest.fn(),
    findByTokenHash: jest.fn().mockResolvedValue(record),
    incrementAttempts: jest.fn(),
    markVerified: jest.fn(),
    markUsed: jest.fn(),
    deleteActiveByUserId: jest.fn(),
  };

  const passwordHasher: PasswordHasher = {
    hash: jest.fn().mockResolvedValue("hash-da-nova-senha"),
  };

  return { userRepository, passwordResetRepository, passwordHasher };
}

describe("ResetPasswordUseCase", () => {
  it("lança erro genérico se o token não existe, expirou ou já foi usado", async () => {
    const { userRepository, passwordResetRepository, passwordHasher } = criarMocks(null);
    const useCase = new ResetPasswordUseCase(
      userRepository,
      passwordResetRepository,
      passwordHasher,
    );

    await expect(useCase.execute({ token: TOKEN, newPassword: "senha-nova-123" })).rejects.toThrow(
      DomainError,
    );
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("exige que o código já tenha sido verificado antes de trocar a senha", async () => {
    const { userRepository, passwordResetRepository, passwordHasher } = criarMocks(
      fakeRecord({ status: "PENDING", verificadoEm: null }),
    );
    const useCase = new ResetPasswordUseCase(
      userRepository,
      passwordResetRepository,
      passwordHasher,
    );

    await expect(useCase.execute({ token: TOKEN, newPassword: "senha-nova-123" })).rejects.toThrow(
      "Confirme o código de verificação antes de definir a nova senha.",
    );
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("hasheia a nova senha, marca o token como usado e só então troca a senha", async () => {
    const record = fakeRecord();
    const { userRepository, passwordResetRepository, passwordHasher } = criarMocks(record);
    const useCase = new ResetPasswordUseCase(
      userRepository,
      passwordResetRepository,
      passwordHasher,
    );

    const callOrder: string[] = [];
    (passwordResetRepository.markUsed as jest.Mock).mockImplementation(async () => {
      callOrder.push("markUsed");
    });
    (userRepository.updatePassword as jest.Mock).mockImplementation(async () => {
      callOrder.push("updatePassword");
    });

    await useCase.execute({ token: TOKEN, newPassword: "senha-nova-123" });

    expect(passwordHasher.hash).toHaveBeenCalledWith("senha-nova-123");
    expect(passwordResetRepository.markUsed).toHaveBeenCalledWith("reset-1");
    expect(userRepository.updatePassword).toHaveBeenCalledWith("user-1", "hash-da-nova-senha");
    expect(callOrder).toEqual(["markUsed", "updatePassword"]);
  });
});
