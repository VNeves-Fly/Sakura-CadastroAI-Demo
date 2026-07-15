import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaUserRepository } from "@/modules/users/infrastructure/repositories/prisma-user.repository";
import { BcryptPasswordHasher } from "@/modules/users/infrastructure/adapters/bcrypt-password-hasher.adapter";
import { CreateUserUseCase } from "@/modules/users/application/use-cases/create-user.use-case";
import { ListUsersUseCase } from "@/modules/users/application/use-cases/list-users.use-case";
import { GetUserByIdUseCase } from "@/modules/users/application/use-cases/get-user-by-id.use-case";
import type { CreateUserInput } from "@/modules/users/application/dto/create-user.dto";

// Composition root do módulo users: única camada que conhece Prisma/bcrypt
// concretos, mantendo domínio e casos de uso dependentes apenas de abstrações.
const userRepository = new PrismaUserRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();

export const usersController = {
  create(input: CreateUserInput) {
    const useCase = new CreateUserUseCase(userRepository, passwordHasher);
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
};
