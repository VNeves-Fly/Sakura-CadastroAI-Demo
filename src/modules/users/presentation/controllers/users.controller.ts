import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { PrismaUserRepository } from "@/modules/users/infrastructure/repositories/prisma-user.repository";
import { PrismaPasswordResetRepository } from "@/modules/users/infrastructure/repositories/prisma-password-reset.repository";
import { BcryptPasswordHasher } from "@/modules/users/infrastructure/adapters/bcrypt-password-hasher.adapter";
import { RandomPasswordGenerator } from "@/modules/users/infrastructure/adapters/random-password-generator.adapter";
import { RandomPasswordResetCodeGenerator } from "@/modules/users/infrastructure/adapters/random-password-reset-code-generator.adapter";
import { createWelcomeEmailSender } from "@/modules/users/infrastructure/factories/welcome-email-sender.factory";
import { createEmailSender } from "@/modules/users/infrastructure/factories/email-sender.factory";
import { CreateUserUseCase } from "@/modules/users/application/use-cases/create-user.use-case";
import { ListUsersUseCase } from "@/modules/users/application/use-cases/list-users.use-case";
import { GetUserByIdUseCase } from "@/modules/users/application/use-cases/get-user-by-id.use-case";
import {
  ChangePasswordUseCase,
  type ChangePasswordInput,
} from "@/modules/users/application/use-cases/change-password.use-case";
import {
  RequestPasswordResetUseCase,
  type RequestPasswordResetInput,
} from "@/modules/users/application/use-cases/request-password-reset.use-case";
import {
  VerifyPasswordResetCodeUseCase,
  type VerifyPasswordResetCodeInput,
} from "@/modules/users/application/use-cases/verify-password-reset-code.use-case";
import {
  ResetPasswordUseCase,
  type ResetPasswordInput,
} from "@/modules/users/application/use-cases/reset-password.use-case";
import type { CreateUserInput } from "@/modules/users/application/dto/create-user.dto";

// Composition root do módulo users: única camada que conhece Prisma/bcrypt
// concretos, mantendo domínio e casos de uso dependentes apenas de abstrações.
const userRepository = new PrismaUserRepository(prisma);
const passwordResetRepository = new PrismaPasswordResetRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();
const passwordGenerator = new RandomPasswordGenerator();
const passwordResetCodeGenerator = new RandomPasswordResetCodeGenerator();
const welcomeEmailSender = createWelcomeEmailSender();
const emailSender = createEmailSender();

export const usersController = {
  create(input: CreateUserInput) {
    const useCase = new CreateUserUseCase(
      userRepository,
      passwordHasher,
      passwordGenerator,
      welcomeEmailSender,
    );
    return useCase.execute(input);
  },

  list() {
    const useCase = new ListUsersUseCase(userRepository);
    return useCase.execute();
  },

  getById(id: string) {
    const useCase = new GetUserByIdUseCase(userRepository);
    return useCase.execute(id);
  },

  changePassword(input: ChangePasswordInput) {
    const useCase = new ChangePasswordUseCase(userRepository, passwordHasher);
    return useCase.execute(input);
  },

  requestPasswordReset(input: RequestPasswordResetInput) {
    const useCase = new RequestPasswordResetUseCase(
      userRepository,
      passwordResetRepository,
      passwordResetCodeGenerator,
      emailSender,
    );
    return useCase.execute(input);
  },

  async requestPasswordResetForUser(userId: string, baseUrl: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("Usuário");
    }

    const useCase = new RequestPasswordResetUseCase(
      userRepository,
      passwordResetRepository,
      passwordResetCodeGenerator,
      emailSender,
    );
    return useCase.execute({ email: user.email, baseUrl });
  },

  verifyPasswordResetCode(input: VerifyPasswordResetCodeInput) {
    const useCase = new VerifyPasswordResetCodeUseCase(passwordResetRepository);
    return useCase.execute(input);
  },

  resetPassword(input: ResetPasswordInput) {
    const useCase = new ResetPasswordUseCase(
      userRepository,
      passwordResetRepository,
      passwordHasher,
    );
    return useCase.execute(input);
  },
};
