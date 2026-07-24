import { VerifyPasswordResetCodeUseCase } from "@/modules/users/application/use-cases/verify-password-reset-code.use-case";
import { hashPasswordResetValue } from "@/modules/users/utils/password-reset-hash.util";
import { MAX_OTP_ATTEMPTS } from "@/modules/users/domain/password-reset.constants";
import { DomainError } from "@/modules/shared/domain/errors";
import type {
  PasswordResetRecord,
  PasswordResetRepository,
} from "@/modules/users/domain/repositories/password-reset-repository";

const TOKEN = "raw-token";
const CODIGO = "123456";

function fakeRecord(overrides: Partial<PasswordResetRecord> = {}): PasswordResetRecord {
  return {
    id: "reset-1",
    userId: "user-1",
    tokenHash: hashPasswordResetValue(TOKEN),
    codigoHash: hashPasswordResetValue(CODIGO),
    status: "PENDING",
    tentativas: 0,
    verificadoEm: null,
    usadoEm: null,
    expiraEm: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

function criarMocks(record: PasswordResetRecord | null) {
  const passwordResetRepository: PasswordResetRepository = {
    create: jest.fn(),
    findByTokenHash: jest.fn().mockResolvedValue(record),
    incrementAttempts: jest
      .fn()
      .mockResolvedValue(record ? { ...record, tentativas: record.tentativas + 1 } : null),
    markVerified: jest.fn(),
    markUsed: jest.fn(),
    deleteActiveByUserId: jest.fn(),
  };

  return { passwordResetRepository };
}

describe("VerifyPasswordResetCodeUseCase", () => {
  it("lança erro genérico se o token não existe", async () => {
    const { passwordResetRepository } = criarMocks(null);
    const useCase = new VerifyPasswordResetCodeUseCase(passwordResetRepository);

    await expect(useCase.execute({ token: TOKEN, codigo: CODIGO })).rejects.toThrow(DomainError);
  });

  it("lança erro genérico se o token expirou", async () => {
    const { passwordResetRepository } = criarMocks(
      fakeRecord({ expiraEm: new Date(Date.now() - 1000) }),
    );
    const useCase = new VerifyPasswordResetCodeUseCase(passwordResetRepository);

    await expect(useCase.execute({ token: TOKEN, codigo: CODIGO })).rejects.toThrow(DomainError);
  });

  it("lança erro genérico se o token já foi usado", async () => {
    const { passwordResetRepository } = criarMocks(fakeRecord({ status: "USED" }));
    const useCase = new VerifyPasswordResetCodeUseCase(passwordResetRepository);

    await expect(useCase.execute({ token: TOKEN, codigo: CODIGO })).rejects.toThrow(DomainError);
  });

  it("lança erro de tentativas excedidas sem comparar o código", async () => {
    const { passwordResetRepository } = criarMocks(fakeRecord({ tentativas: MAX_OTP_ATTEMPTS }));
    const useCase = new VerifyPasswordResetCodeUseCase(passwordResetRepository);

    await expect(useCase.execute({ token: TOKEN, codigo: CODIGO })).rejects.toThrow(
      "Você excedeu o número de tentativas. Solicite um novo código.",
    );
    expect(passwordResetRepository.incrementAttempts).not.toHaveBeenCalled();
  });

  it("incrementa tentativas e lança erro genérico se o código está errado", async () => {
    const { passwordResetRepository } = criarMocks(fakeRecord());
    const useCase = new VerifyPasswordResetCodeUseCase(passwordResetRepository);

    await expect(useCase.execute({ token: TOKEN, codigo: "000000" })).rejects.toThrow(DomainError);
    expect(passwordResetRepository.incrementAttempts).toHaveBeenCalledWith("reset-1");
    expect(passwordResetRepository.markVerified).not.toHaveBeenCalled();
  });

  it("marca como verificado quando o código bate e o status é PENDING", async () => {
    const { passwordResetRepository } = criarMocks(fakeRecord());
    const useCase = new VerifyPasswordResetCodeUseCase(passwordResetRepository);

    await useCase.execute({ token: TOKEN, codigo: CODIGO });

    expect(passwordResetRepository.markVerified).toHaveBeenCalledWith("reset-1");
    expect(passwordResetRepository.incrementAttempts).not.toHaveBeenCalled();
  });

  it("é idempotente: reenviar o código certo com status já VERIFIED não falha nem re-marca", async () => {
    const { passwordResetRepository } = criarMocks(fakeRecord({ status: "VERIFIED" }));
    const useCase = new VerifyPasswordResetCodeUseCase(passwordResetRepository);

    await expect(useCase.execute({ token: TOKEN, codigo: CODIGO })).resolves.toBeUndefined();
    expect(passwordResetRepository.markVerified).not.toHaveBeenCalled();
  });
});
