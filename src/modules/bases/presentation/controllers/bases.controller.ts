import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaBaseRepository } from "@/modules/bases/infrastructure/repositories/prisma-base.repository";
import { ListarBasesUseCase } from "@/modules/bases/application/use-cases/listar-bases.use-case";
import { GetBaseByIdUseCase } from "@/modules/bases/application/use-cases/get-base-by-id.use-case";
import { CreateBaseUseCase } from "@/modules/bases/application/use-cases/create-base.use-case";
import { UpdateBaseUseCase } from "@/modules/bases/application/use-cases/update-base.use-case";
import type { CreateBaseInput } from "@/modules/bases/application/dto/create-base.dto";
import type { UpdateBaseInput } from "@/modules/bases/application/dto/update-base.dto";

const baseRepository = new PrismaBaseRepository(prisma);

export const basesController = {
  async list() {
    const useCase = new ListarBasesUseCase(baseRepository);
    const bases = await useCase.execute();
    return bases.map((base) => base.toJSON());
  },

  async getById(id: string) {
    const useCase = new GetBaseByIdUseCase(baseRepository);
    const base = await useCase.execute(id);
    return base.toJSON();
  },

  async create(input: CreateBaseInput) {
    const useCase = new CreateBaseUseCase(baseRepository);
    const base = await useCase.execute(input);
    return base.toJSON();
  },

  async update(id: string, data: UpdateBaseInput) {
    const useCase = new UpdateBaseUseCase(baseRepository);
    const base = await useCase.execute({ id, data });
    return base.toJSON();
  },
};
