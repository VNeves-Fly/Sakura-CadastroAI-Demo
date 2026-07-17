import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import {
  ProcessarWebhookD4SignUseCase,
  type ProcessarWebhookD4SignInput,
} from "@/modules/cadastro/application/use-cases/processar-webhook-d4sign.use-case";

const agenciaRepository = new PrismaAgenciaRepository(prisma);

export const webhookD4SignController = {
  processar(input: ProcessarWebhookD4SignInput) {
    const useCase = new ProcessarWebhookD4SignUseCase(agenciaRepository);
    return useCase.execute(input);
  },
};
