import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaBiometriaVerificacaoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-biometria-verificacao.repository";
import {
  ProcessarWebhookLegitimuzUseCase,
  type ProcessarWebhookLegitimuzInput,
} from "@/modules/cadastro/application/use-cases/processar-webhook-legitimuz.use-case";

const biometriaVerificacaoRepository = new PrismaBiometriaVerificacaoRepository(prisma);

export const webhookLegitimuzController = {
  processar(input: ProcessarWebhookLegitimuzInput) {
    const useCase = new ProcessarWebhookLegitimuzUseCase(biometriaVerificacaoRepository);
    return useCase.execute(input);
  },
};
