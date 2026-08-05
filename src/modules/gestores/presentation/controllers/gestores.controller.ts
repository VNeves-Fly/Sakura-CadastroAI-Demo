import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaGestorRepository } from "@/modules/gestores/infrastructure/repositories/prisma-gestor.repository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/repositories/prisma-user.repository";
import { BcryptPasswordHasher } from "@/modules/users/infrastructure/adapters/bcrypt-password-hasher.adapter";
import { RandomPasswordGenerator } from "@/modules/users/infrastructure/adapters/random-password-generator.adapter";
import { createWelcomeEmailSender } from "@/modules/users/infrastructure/factories/welcome-email-sender.factory";
import { ListarGestoresUseCase } from "@/modules/gestores/application/use-cases/listar-gestores.use-case";
import { GetGestorByIdUseCase } from "@/modules/gestores/application/use-cases/get-gestor-by-id.use-case";
import { CreateGestorUseCase } from "@/modules/gestores/application/use-cases/create-gestor.use-case";
import { UpdateGestorUseCase } from "@/modules/gestores/application/use-cases/update-gestor.use-case";
import type { CreateGestorInput } from "@/modules/gestores/application/dto/create-gestor.dto";
import type { UpdateGestorInput } from "@/modules/gestores/application/dto/update-gestor.dto";

// Composition root do módulo gestores — única camada que conhece
// Prisma/bcrypt concretos, mesmo padrão de users.controller.ts. Reaproveita
// direto os adapters de senha/e-mail do módulo users (framework-agnósticos,
// não específicos de User) em vez de duplicá-los.
const gestorRepository = new PrismaGestorRepository(prisma);
const userRepository = new PrismaUserRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();
const passwordGenerator = new RandomPasswordGenerator();
const welcomeEmailSender = createWelcomeEmailSender();

export const gestoresController = {
  // As use-cases de listar/buscar devolvem a entidade de domínio (Gestor) —
  // reaproveitadas também pelo módulo atribuições (agregacoes.util.ts), que
  // precisa dos getters, não de JSON puro. Mapeia pra toJSON() só aqui, na
  // borda HTTP.
  async list() {
    const useCase = new ListarGestoresUseCase(gestorRepository);
    const gestores = await useCase.execute();
    return gestores.map((gestor) => gestor.toJSON());
  },

  async getById(id: string) {
    const useCase = new GetGestorByIdUseCase(gestorRepository);
    const gestor = await useCase.execute(id);
    return gestor.toJSON();
  },

  create(input: CreateGestorInput) {
    const useCase = new CreateGestorUseCase(
      gestorRepository,
      userRepository,
      passwordHasher,
      passwordGenerator,
      welcomeEmailSender,
    );
    return useCase.execute(input);
  },

  update(id: string, data: UpdateGestorInput) {
    const useCase = new UpdateGestorUseCase(
      gestorRepository,
      userRepository,
      passwordHasher,
      passwordGenerator,
      welcomeEmailSender,
    );
    return useCase.execute({ id, data });
  },
};
