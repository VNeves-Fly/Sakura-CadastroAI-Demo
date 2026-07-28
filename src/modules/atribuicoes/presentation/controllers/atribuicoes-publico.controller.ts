import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaPromotorRepository } from "@/modules/atribuicoes/infrastructure/repositories/prisma-promotor.repository";
import { createEmailSender } from "@/modules/users/infrastructure/factories/email-sender.factory";
import {
  SolicitarLinkExecutivoUseCase,
  type SolicitarLinkExecutivoInput,
} from "@/modules/atribuicoes/application/use-cases/solicitar-link-executivo.use-case";

const promotorRepository = new PrismaPromotorRepository(prisma);
const emailSender = createEmailSender();

// Porta de entrada do módulo atribuições pro público externo (sem login)
// — separada de atribuicoes-admin.controller.ts, que só serve o painel
// autenticado.
export const atribuicoesPublicoController = {
  solicitarLinkExecutivo(input: SolicitarLinkExecutivoInput) {
    const useCase = new SolicitarLinkExecutivoUseCase(promotorRepository, emailSender);
    return useCase.execute(input);
  },
};
