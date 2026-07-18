import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import { PrismaSignatarioPadraoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-signatario-padrao.repository";
import {
  ProcessarWebhookD4SignUseCase,
  type ProcessarWebhookD4SignInput,
} from "@/modules/cadastro/application/use-cases/processar-webhook-d4sign.use-case";

const agenciaRepository = new PrismaAgenciaRepository(prisma);
const signatarioPadraoRepository = new PrismaSignatarioPadraoRepository(prisma);

export const webhookD4SignController = {
  processar(input: ProcessarWebhookD4SignInput) {
    const useCase = new ProcessarWebhookD4SignUseCase(
      agenciaRepository,
      signatarioPadraoRepository,
    );
    return useCase.execute(input);
  },
};
