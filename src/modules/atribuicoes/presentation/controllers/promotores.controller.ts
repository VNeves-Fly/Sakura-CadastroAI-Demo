import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaPromotorRepository } from "@/modules/atribuicoes/infrastructure/repositories/prisma-promotor.repository";
import { PrismaGestorRepository } from "@/modules/gestores/infrastructure/repositories/prisma-gestor.repository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/repositories/prisma-user.repository";
import { BcryptPasswordHasher } from "@/modules/users/infrastructure/adapters/bcrypt-password-hasher.adapter";
import { RandomPasswordGenerator } from "@/modules/users/infrastructure/adapters/random-password-generator.adapter";
import { createWelcomeEmailSender } from "@/modules/users/infrastructure/factories/welcome-email-sender.factory";
import { ListarPromotoresUseCase } from "@/modules/atribuicoes/application/use-cases/listar-promotores.use-case";
import { GetPromotorByIdUseCase } from "@/modules/atribuicoes/application/use-cases/get-promotor-by-id.use-case";
import { CriarPromotorUseCase } from "@/modules/atribuicoes/application/use-cases/criar-promotor.use-case";
import { AtualizarPromotorUseCase } from "@/modules/atribuicoes/application/use-cases/atualizar-promotor.use-case";
import type { CreatePromotorInput } from "@/modules/atribuicoes/application/dto/create-promotor.dto";
import type { UpdatePromotorInput } from "@/modules/atribuicoes/application/dto/update-promotor.dto";

// Composition root do CRUD de Promotor/Executivo — separado do
// atribuicoes-admin.controller.ts (que serve as telas de leitura agregada
// de /atribuicoes) porque devolve JSON puro (toJSON()) pra API, não a
// entidade de domínio.
const promotorRepository = new PrismaPromotorRepository(prisma);
const gestorRepository = new PrismaGestorRepository(prisma);
const userRepository = new PrismaUserRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();
const passwordGenerator = new RandomPasswordGenerator();
const welcomeEmailSender = createWelcomeEmailSender();

export const promotoresController = {
  async list() {
    const useCase = new ListarPromotoresUseCase(promotorRepository);
    const promotores = await useCase.execute();
    return promotores.map((promotor) => promotor.toJSON());
  },

  async getById(id: string) {
    const useCase = new GetPromotorByIdUseCase(promotorRepository);
    const promotor = await useCase.execute(id);
    return promotor.toJSON();
  },

  create(input: CreatePromotorInput) {
    const useCase = new CriarPromotorUseCase(
      promotorRepository,
      gestorRepository,
      userRepository,
      passwordHasher,
      passwordGenerator,
      welcomeEmailSender,
    );
    return useCase.execute(input);
  },

  update(id: string, data: UpdatePromotorInput) {
    const useCase = new AtualizarPromotorUseCase(
      promotorRepository,
      gestorRepository,
      userRepository,
      passwordHasher,
      passwordGenerator,
      welcomeEmailSender,
    );
    return useCase.execute({ id, data });
  },
};
