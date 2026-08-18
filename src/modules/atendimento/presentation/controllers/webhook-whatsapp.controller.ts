import { prisma } from "@/modules/shared/infrastructure/prisma/client";
import { PrismaNotificacaoRepository } from "@/modules/cadastro/infrastructure/repositories/prisma-notificacao.repository";
import { atendimentoInfra } from "@/modules/atendimento/presentation/controllers/atendimento.controller";
import { ReceberMensagemWhatsAppUseCase } from "@/modules/atendimento/application/use-cases/receber-mensagem-whatsapp.use-case";
import { AtualizarStatusMensagemUseCase } from "@/modules/atendimento/application/use-cases/atualizar-status-mensagem.use-case";
import type { ReceberMensagemInboundInput } from "@/modules/atendimento/application/dto/receber-mensagem-inbound.dto";
import type { AtualizarStatusMensagemInput } from "@/modules/atendimento/application/dto/atualizar-status-mensagem.dto";

const notificacaoRepository = new PrismaNotificacaoRepository(prisma);

export const webhookWhatsAppController = {
  processarInbound(input: ReceberMensagemInboundInput) {
    const useCase = new ReceberMensagemWhatsAppUseCase(
      atendimentoInfra.conversaRepository,
      atendimentoInfra.mensagemRepository,
      atendimentoInfra.contactMatcher,
      atendimentoInfra.whatsAppMessagingService,
      atendimentoInfra.fileStorage,
      notificacaoRepository,
    );
    return useCase.execute(input);
  },

  atualizarStatus(input: AtualizarStatusMensagemInput) {
    const useCase = new AtualizarStatusMensagemUseCase(atendimentoInfra.mensagemRepository);
    return useCase.execute(input);
  },
};
