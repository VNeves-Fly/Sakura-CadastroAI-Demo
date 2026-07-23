import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { MensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { MensagemRepository } from "@/modules/atendimento/domain/repositories/mensagem-repository";
import type { WhatsAppContactMatcher } from "@/modules/atendimento/domain/services/whatsapp-contact-matcher";
import type { WhatsAppMessagingService } from "@/modules/atendimento/domain/services/whatsapp-messaging-service";
import type { ReceberMensagemInboundInput } from "@/modules/atendimento/application/dto/receber-mensagem-inbound.dto";

const EXTENSAO_POR_TIPO: Record<string, string> = {
  audio: "ogg",
  imagem: "jpg",
  pdf: "pdf",
};

export class ReceberMensagemWhatsAppUseCase {
  constructor(
    private readonly conversaRepository: ConversaRepository,
    private readonly mensagemRepository: MensagemRepository,
    private readonly contactMatcher: WhatsAppContactMatcher,
    private readonly whatsAppMessagingService: WhatsAppMessagingService,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: ReceberMensagemInboundInput): Promise<MensagemEntity | null> {
    // Idempotência — Meta redelivera webhooks em retry.
    const existente = await this.mensagemRepository.findByWaMessageId(input.waMessageId);
    if (existente) return null;

    let conversa = await this.conversaRepository.findByTelefoneWhatsapp(input.telefoneWhatsapp);

    if (!conversa) {
      const contato = await this.contactMatcher.match(input.telefoneWhatsapp);
      conversa = await this.conversaRepository.create({
        telefoneWhatsapp: input.telefoneWhatsapp,
        tipoContato: contato ? "agencia" : "nao_identificado",
        agenciaId: contato?.agenciaId ?? null,
        representanteLegalId: contato?.representanteLegalId ?? null,
        membroNome: contato?.membroNome ?? input.nomePerfil,
        membroPapel: contato?.membroPapel ?? "outro",
        membroTelefone: input.telefoneWhatsapp,
      });
    }

    let midiaId: string | undefined;
    let tamanhoArquivoBytes: number | undefined;

    if (input.tipo !== "texto" && input.mediaId) {
      const midia = await this.whatsAppMessagingService.baixarMidia(input.mediaId);
      const extensao = EXTENSAO_POR_TIPO[input.tipo] ?? "bin";
      const salvo = await this.fileStorage.save(
        {
          buffer: midia.buffer,
          originalName: `${input.mediaId}.${extensao}`,
          mimeType: midia.mimeType,
        },
        `atendimento/${conversa.id}`,
      );
      const registroMidia = await this.mensagemRepository.criarMidia({
        fileName: `${input.mediaId}.${extensao}`,
        mimeType: midia.mimeType,
        gcsPath: salvo.path,
        gcsBucket: salvo.bucket,
        gcsSize: midia.buffer.byteLength,
      });
      midiaId = registroMidia.id;
      tamanhoArquivoBytes = midia.buffer.byteLength;
    }

    const mensagem = await this.mensagemRepository.create({
      conversaId: conversa.id,
      autor: "cliente",
      analistaId: null,
      tipo: input.tipo,
      conteudo: input.conteudo,
      duracaoSegundos: input.duracaoSegundos,
      tamanhoArquivoBytes,
      midiaId,
      waMessageId: input.waMessageId,
      lido: false,
    });

    await this.conversaRepository.touchLastMessage(conversa.id, new Date());

    return mensagem;
  }
}
