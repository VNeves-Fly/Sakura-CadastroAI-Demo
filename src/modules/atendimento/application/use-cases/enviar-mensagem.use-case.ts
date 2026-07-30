import { NotFoundError } from "@/modules/shared/domain/errors";
import { HORAS_JANELA_ATENDIMENTO_META } from "@/modules/atendimento/domain/atendimento.constants";
import { ForaDaJanela24hError } from "@/modules/atendimento/domain/errors";
import type { MensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { MensagemRepository } from "@/modules/atendimento/domain/repositories/mensagem-repository";
import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type { WhatsAppMessagingService } from "@/modules/atendimento/domain/services/whatsapp-messaging-service";
import type { EnviarMensagemInput } from "@/modules/atendimento/application/dto/enviar-mensagem.dto";
import { garantirAtendimentoAssumido } from "@/modules/atendimento/application/shared/garantir-atendimento-assumido";

function janela24hFechada(ultimaMensagemClienteEm: string | null): boolean {
  if (!ultimaMensagemClienteEm) return true;
  const horas = (Date.now() - new Date(ultimaMensagemClienteEm).getTime()) / (1000 * 60 * 60);
  return horas > HORAS_JANELA_ATENDIMENTO_META;
}

export class EnviarMensagemUseCase {
  constructor(
    private readonly conversaRepository: ConversaRepository,
    private readonly mensagemRepository: MensagemRepository,
    private readonly templateWhatsAppRepository: TemplateWhatsAppRepository,
    private readonly whatsAppMessagingService: WhatsAppMessagingService,
    private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository,
  ) {}

  async execute(input: EnviarMensagemInput): Promise<MensagemEntity> {
    const conversa = await this.conversaRepository.findById(input.conversaId);
    if (!conversa) throw new NotFoundError("Conversa");

    // Conversa de contato não identificado (agenciaId null) não tem
    // agência nenhuma pra travar — só conversas vinculadas exigem
    // atendimento assumido antes de mandar mensagem (decisão do usuário,
    // 2026-07-28).
    if (conversa.agenciaId) {
      await garantirAtendimentoAssumido(
        this.atendimentoAgenciaRepository,
        conversa.agenciaId,
        input.analistaId,
      );
    }

    let waMessageId: string | undefined;

    // Envio real pra Meta só se aplica a mensagens de texto — anexo de
    // mídia pelo analista ainda não tem upload real na UI (thread-conversa
    // `anexarMock` só simula), então esse caminho apenas persiste local.
    if (input.tipo === "texto") {
      const ultimaMsgCliente = [...conversa.mensagens]
        .reverse()
        .find((mensagem) => mensagem.autor === "cliente");

      if (janela24hFechada(ultimaMsgCliente?.createdAt ?? null)) {
        // Janela fechada só aceita mensagem de template (regra da Meta) —
        // `templateId` vem do picker de template em ThreadConversa;
        // texto livre (sem templateId) é recusado com ForaDaJanela24hError.
        if (!input.templateId) throw new ForaDaJanela24hError();

        const templates = await this.templateWhatsAppRepository.findAllAprovados();
        const template = templates.find((item) => item.id === input.templateId);
        if (!template) throw new ForaDaJanela24hError();

        const resultado = await this.whatsAppMessagingService.enviarTemplate(
          conversa.membro.telefone,
          template.nome,
          template.idioma,
          input.variaveis,
        );
        waMessageId = resultado.waMessageId;
      } else {
        const resultado = await this.whatsAppMessagingService.enviarTexto(
          conversa.membro.telefone,
          input.conteudo,
        );
        waMessageId = resultado.waMessageId;
      }
    }

    const mensagem = await this.mensagemRepository.create({
      conversaId: input.conversaId,
      autor: "analista",
      analistaId: input.analistaId,
      tipo: input.tipo,
      conteudo: input.conteudo,
      duracaoSegundos: input.duracaoSegundos,
      waMessageId,
    });

    await this.conversaRepository.touchLastMessage(input.conversaId, new Date());

    return mensagem;
  }
}
