import { RequestPasswordResetUseCase } from "@/modules/users/application/use-cases/request-password-reset.use-case";
import { hashPasswordResetValue } from "@/modules/users/utils/password-reset-hash.util";
import { User } from "@/modules/users/domain/entities/user.entity";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { PasswordResetRepository } from "@/modules/users/domain/repositories/password-reset-repository";
import type { PasswordResetCodeGenerator } from "@/modules/users/domain/services/password-reset-code-generator";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";

const BASE_URL = "https://painel.sakuraclick.com.br";

function fakeUser(): User {
  return User.create({
    id: "user-1",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "11999999999",
    cargo: "ANALISTA",
    mustChangePassword: false,
    ativo: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function criarMocks(user: User | null) {
  const userRepository: UserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(user),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    updatePassword: jest.fn(),
  };

  const passwordResetRepository: PasswordResetRepository = {
    create: jest.fn().mockResolvedValue({}),
    findByTokenHash: jest.fn(),
    incrementAttempts: jest.fn(),
    markVerified: jest.fn(),
    markUsed: jest.fn(),
    deleteActiveByUserId: jest.fn(),
  };

  const codeGenerator: PasswordResetCodeGenerator = {
    generate: jest.fn().mockReturnValue({ token: "raw-token", codigo: "123456" }),
  };

  const emailSender: EmailSender = { send: jest.fn().mockResolvedValue(undefined) };

  return { userRepository, passwordResetRepository, codeGenerator, emailSender };
}

describe("RequestPasswordResetUseCase", () => {
  it("não faz nada se o e-mail não existe (evita enumeração)", async () => {
    const { userRepository, passwordResetRepository, codeGenerator, emailSender } =
      criarMocks(null);
    const useCase = new RequestPasswordResetUseCase(
      userRepository,
      passwordResetRepository,
      codeGenerator,
      emailSender,
    );

    await useCase.execute({ email: "naoexiste@example.com", baseUrl: BASE_URL });

    expect(passwordResetRepository.create).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("invalida tokens ativos, cria um novo hasheado e envia o e-mail com o código e o link", async () => {
    const user = fakeUser();
    const { userRepository, passwordResetRepository, codeGenerator, emailSender } =
      criarMocks(user);
    const useCase = new RequestPasswordResetUseCase(
      userRepository,
      passwordResetRepository,
      codeGenerator,
      emailSender,
    );

    await useCase.execute({ email: user.email, baseUrl: BASE_URL });

    expect(passwordResetRepository.deleteActiveByUserId).toHaveBeenCalledWith("user-1");
    expect(passwordResetRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        tokenHash: hashPasswordResetValue("raw-token"),
        codigoHash: hashPasswordResetValue("123456"),
      }),
    );

    const [emailInput] = (emailSender.send as jest.Mock).mock.calls[0];
    expect(emailInput.to).toBe("ada@example.com");
    expect(emailInput.html).toContain("123456");
    expect(emailInput.html).toContain("/redefinir-senha/raw-token");
  });

  it("não lança se o envio do e-mail falhar (best-effort)", async () => {
    const user = fakeUser();
    const { userRepository, passwordResetRepository, codeGenerator, emailSender } =
      criarMocks(user);
    (emailSender.send as jest.Mock).mockRejectedValue(new Error("falha no provedor"));
    const useCase = new RequestPasswordResetUseCase(
      userRepository,
      passwordResetRepository,
      codeGenerator,
      emailSender,
    );

    await expect(
      useCase.execute({ email: user.email, baseUrl: BASE_URL }),
    ).resolves.toBeUndefined();
  });
});
