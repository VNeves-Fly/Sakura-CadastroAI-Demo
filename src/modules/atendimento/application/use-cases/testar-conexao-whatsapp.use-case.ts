import type { WhatsAppMessagingService } from "@/modules/atendimento/domain/services/whatsapp-messaging-service";

export interface ResultadoTesteConexaoOutput {
  sucesso: boolean;
  mensagem: string;
}

export class TestarConexaoWhatsappUseCase {
  constructor(private readonly whatsAppMessagingService: WhatsAppMessagingService) {}

  async execute(): Promise<ResultadoTesteConexaoOutput> {
    try {
      const { displayPhoneNumber, verifiedName } =
        await this.whatsAppMessagingService.verificarCredenciais();
      return {
        sucesso: true,
        mensagem: `Conectado com sucesso ao número ${displayPhoneNumber} (${verifiedName}).`,
      };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Falha ao conectar com a Meta.",
      };
    }
  }
}
