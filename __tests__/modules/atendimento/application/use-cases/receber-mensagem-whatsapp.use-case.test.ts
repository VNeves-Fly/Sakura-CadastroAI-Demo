import { ReceberMensagemWhatsAppUseCase } from "@/modules/atendimento/application/use-cases/receber-mensagem-whatsapp.use-case";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { MensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";
import type { CriarMensagemData } from "@/modules/atendimento/domain/repositories/mensagem-repository";
import type { WhatsAppContactMatcher } from "@/modules/atendimento/domain/services/whatsapp-contact-matcher";
import type { ReceberMensagemInboundInput } from "@/modules/atendimento/application/dto/receber-mensagem-inbound.dto";
import {
  fakeConversa,
  fakeConversaRepository,
  fakeMensagemRepository,
  fakeWhatsAppMessagingService,
} from "../../fixtures";

function fakeMensagem(data: Partial<CriarMensagemData> = {}): MensagemEntity {
  return {
    id: "msg-gerada",
    conversaId: data.conversaId ?? "conv-1",
    autor: data.autor ?? "cliente",
    tipo: data.tipo ?? "texto",
    conteudo: data.conteudo ?? "",
    lido: false,
    createdAt: "2026-01-02T00:00:00.000Z",
  };
}

const INPUT_TEXTO: ReceberMensagemInboundInput = {
  telefoneWhatsapp: "5511988887777",
  nomePerfil: "Cliente Teste",
  tipo: "texto",
  conteudo: "Oi, preciso de ajuda",
  waMessageId: "wamid.abc",
};

function criarUseCase() {
  const conversaRepository = fakeConversaRepository({
    findByTelefoneWhatsapp: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(fakeConversa()),
  });

  const mensagemRepository = fakeMensagemRepository({
    create: jest
      .fn()
      .mockImplementation((data: CriarMensagemData) => Promise.resolve(fakeMensagem(data))),
    criarMidia: jest.fn().mockResolvedValue({ id: "midia-1" }),
    findByWaMessageId: jest.fn().mockResolvedValue(null),
  });

  const contactMatcher: WhatsAppContactMatcher = {
    match: jest.fn().mockResolvedValue(null),
  };

  const whatsAppMessagingService = fakeWhatsAppMessagingService({
    baixarMidia: jest
      .fn()
      .mockResolvedValue({ buffer: Buffer.from("conteudo-binario"), mimeType: "image/jpeg" }),
  });

  const fileStorage: FileStorage = {
    save: jest
      .fn()
      .mockResolvedValue({ path: "atendimento/conv-1/arquivo.jpg", bucket: "meu-bucket" }),
  };

  const useCase = new ReceberMensagemWhatsAppUseCase(
    conversaRepository,
    mensagemRepository,
    contactMatcher,
    whatsAppMessagingService,
    fileStorage,
  );

  return {
    useCase,
    conversaRepository,
    mensagemRepository,
    contactMatcher,
    whatsAppMessagingService,
    fileStorage,
  };
}

describe("ReceberMensagemWhatsAppUseCase", () => {
  it("é idempotente — retorna null sem criar nada se o waMessageId já foi processado", async () => {
    const { useCase, mensagemRepository, conversaRepository } = criarUseCase();
    (mensagemRepository.findByWaMessageId as jest.Mock).mockResolvedValue(fakeMensagem());

    const resultado = await useCase.execute(INPUT_TEXTO);

    expect(resultado).toBeNull();
    expect(conversaRepository.create).not.toHaveBeenCalled();
    expect(mensagemRepository.create).not.toHaveBeenCalled();
  });

  it("reaproveita a conversa existente pelo telefone, sem chamar o contact matcher", async () => {
    const { useCase, conversaRepository, contactMatcher, mensagemRepository } = criarUseCase();
    (conversaRepository.findByTelefoneWhatsapp as jest.Mock).mockResolvedValue(
      fakeConversa({ id: "conv-existente" }),
    );

    await useCase.execute(INPUT_TEXTO);

    expect(contactMatcher.match).not.toHaveBeenCalled();
    expect(conversaRepository.create).not.toHaveBeenCalled();
    expect(mensagemRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ conversaId: "conv-existente", autor: "cliente", analistaId: null }),
    );
  });

  it("cria a conversa vinculada à agência quando o contact matcher encontra o número", async () => {
    const { useCase, conversaRepository, contactMatcher } = criarUseCase();
    (contactMatcher.match as jest.Mock).mockResolvedValue({
      agenciaId: "ag-99",
      representanteLegalId: "rep-1",
      membroNome: "Sócio Encontrado",
      membroPapel: "socio",
    });

    await useCase.execute(INPUT_TEXTO);

    expect(conversaRepository.create).toHaveBeenCalledWith({
      telefoneWhatsapp: "5511988887777",
      tipoContato: "agencia",
      agenciaId: "ag-99",
      representanteLegalId: "rep-1",
      membroNome: "Sócio Encontrado",
      membroPapel: "socio",
      membroTelefone: "5511988887777",
    });
  });

  it("cria a conversa no bucket não identificado quando o contact matcher não acha nada, usando o nome de perfil da Meta", async () => {
    const { useCase, conversaRepository, contactMatcher } = criarUseCase();
    (contactMatcher.match as jest.Mock).mockResolvedValue(null);

    await useCase.execute(INPUT_TEXTO);

    expect(conversaRepository.create).toHaveBeenCalledWith({
      telefoneWhatsapp: "5511988887777",
      tipoContato: "nao_identificado",
      agenciaId: null,
      representanteLegalId: null,
      membroNome: "Cliente Teste",
      membroPapel: "outro",
      membroTelefone: "5511988887777",
    });
  });

  it("mensagem de texto não baixa mídia nem cria registro de arquivo", async () => {
    const { useCase, whatsAppMessagingService, fileStorage, mensagemRepository } = criarUseCase();

    await useCase.execute(INPUT_TEXTO);

    expect(whatsAppMessagingService.baixarMidia).not.toHaveBeenCalled();
    expect(fileStorage.save).not.toHaveBeenCalled();
    expect(mensagemRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ midiaId: undefined, tamanhoArquivoBytes: undefined }),
    );
  });

  it("mensagem de mídia baixa da Meta, salva via FileStorage e referencia o midiaId na mensagem", async () => {
    const {
      useCase,
      whatsAppMessagingService,
      fileStorage,
      mensagemRepository,
      conversaRepository,
    } = criarUseCase();
    (conversaRepository.create as jest.Mock).mockResolvedValue(fakeConversa({ id: "conv-midia" }));

    await useCase.execute({
      ...INPUT_TEXTO,
      tipo: "imagem",
      conteudo: "",
      mediaId: "media-meta-123",
      waMessageId: "wamid.midia",
    });

    expect(whatsAppMessagingService.baixarMidia).toHaveBeenCalledWith("media-meta-123");
    expect(fileStorage.save).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: "image/jpeg", originalName: "media-meta-123.jpg" }),
      "atendimento/conv-midia/media-meta-123",
    );
    expect(mensagemRepository.criarMidia).toHaveBeenCalledWith({
      fileName: "media-meta-123.jpg",
      mimeType: "image/jpeg",
      gcsPath: "atendimento/conv-1/arquivo.jpg",
      gcsBucket: "meu-bucket",
      gcsSize: Buffer.from("conteudo-binario").byteLength,
    });
    expect(mensagemRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conversaId: "conv-midia",
        tipo: "imagem",
        midiaId: "midia-1",
        tamanhoArquivoBytes: Buffer.from("conteudo-binario").byteLength,
        waMessageId: "wamid.midia",
      }),
    );
  });

  it("sempre atualiza lastMessageAt da conversa no final", async () => {
    const { useCase, conversaRepository } = criarUseCase();
    (conversaRepository.create as jest.Mock).mockResolvedValue(fakeConversa({ id: "conv-x" }));

    await useCase.execute(INPUT_TEXTO);

    expect(conversaRepository.touchLastMessage).toHaveBeenCalledWith("conv-x", expect.any(Date));
  });
});
