import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaBiometriaVerificacaoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-biometria-verificacao.repository";
import { PrismaAgenciaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-agencia.repository";
import { PrismaContratoSignatarioRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-contrato-signatario.repository";
import { PrismaContratoAssinaturaRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-contrato-assinatura.repository";
import {
  ProcessarWebhookLegitimuzUseCase,
  type ProcessarWebhookLegitimuzInput,
} from "@/modules/cadastro/application/use-cases/processar-webhook-legitimuz.use-case";

const biometriaVerificacaoRepository = new PrismaBiometriaVerificacaoRepository(prisma);
const agenciaRepository = new PrismaAgenciaRepository(prisma);
const contratoSignatarioRepository = new PrismaContratoSignatarioRepository(prisma);
const contratoAssinaturaRepository = new PrismaContratoAssinaturaRepository(prisma);

export const webhookLegitimuzController = {
  processar(input: ProcessarWebhookLegitimuzInput) {
    const useCase = new ProcessarWebhookLegitimuzUseCase(
      biometriaVerificacaoRepository,
      agenciaRepository,
      contratoSignatarioRepository,
      contratoAssinaturaRepository,
    );
    return useCase.execute(input);
  },
};
