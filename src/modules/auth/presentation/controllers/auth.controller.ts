import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaCredentialsRepository } from "@/modules/auth/infrastructure/repositories/prisma-credentials.repository";
import { BcryptPasswordHasher } from "@/modules/auth/infrastructure/adapters/bcrypt-password-hasher.adapter";
import { AuthenticateUserUseCase } from "@/modules/auth/application/use-cases/authenticate-user.use-case";
import type { AuthenticateUserOutput } from "@/modules/auth/application/dto/authenticate-user.dto";

// Composition root do módulo: infraestrutura concreta é injetada aqui,
// mantendo o caso de uso e o domínio agnósticos a Prisma/bcrypt.
function buildAuthenticateUserUseCase(): AuthenticateUserUseCase {
  const credentialsRepository = new PrismaCredentialsRepository(prisma);
  const passwordHasher = new BcryptPasswordHasher();
  return new AuthenticateUserUseCase(credentialsRepository, passwordHasher);
}

export async function authenticateController(
  email: string,
  password: string,
): Promise<AuthenticateUserOutput | null> {
  try {
    const useCase = buildAuthenticateUserUseCase();
    return await useCase.execute({ email, password });
  } catch {
    return null;
  }
}
