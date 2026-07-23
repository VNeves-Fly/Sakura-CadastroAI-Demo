import { EnviarMensagemUseCase } from "@/modules/atendimento/application/use-cases/enviar-mensagem.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { ForaDaJanela24hError } from "@/modules/atendimento/domain/errors";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { MensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";
import type {
  CriarMensagemData,
  MensagemRepository,
} from "@/modules/atendimento/domain/repositories/mensagem-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type { WhatsAppMessagingService } from "@/modules/atendimento/domain/services/whatsapp-messaging-service";

function fakeConversa(overrides: Partial<ConversaEntity> = {}): ConversaEntity {
  return {
    id: "conv-1",
    tipoContato: "agencia",
    agenciaId: "ag-1",
    agenciaNome: "Agência X",
    agenciaCnpj: "11222333000181",
    membro: { id: "conv-1", nome: "Fulano", papel: "socio", telefone: "5511999999999" },
    mensagens: [],
    atendimentoAtual: null,
    historicoAtendimento: [],
    resumoFicha: {
      statusAgencia: "em_andamento",
      documentosAprovados: 0,
      documentosPendentes: 0,
      situacaoCadastralReceita: null,
      contratoStatus: null,
      amatSofiaConsultado: false,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastMessageAt: null,
    ...overrides,
  };
}

function fakeMensagem(data: Partial<CriarMensagemData> = {}): MensagemEntity {
  return {
    id: "msg-gerada",
    conversaId: data.conversaId ?? "conv-1",
    autor: data.autor ?? "analista",
    tipo: data.tipo ?? "texto",
    conteudo: data.conteudo ?? "",
    lido: false,
    createdAt: "2026-01-02T00:00:00.000Z",
  };
}

function criarUseCase() {
  const conversaRepository: ConversaRepository = {
    findAll: jest.fn(),
    findById: jest.fn().mockResolvedValue(fakeConversa()),
    findByTelefoneWhatsapp: jest.fn(),
    create: jest.fn(),
    touchLastMessage: jest.fn(),
  };

  const mensagemRepository: MensagemRepository = {
    create: jest
      .fn()
      .mockImplementation((data: CriarMensagemData) => Promise.resolve(fakeMensagem(data))),
    criarMidia: jest.fn(),
    findMidiaById: jest.fn(),
    marcarClienteComoLidas: jest.fn(),
    findByWaMessageId: jest.fn(),
    atualizarStatusPorWaMessageId: jest.fn(),
  };

  const templateWhatsAppRepository: TemplateWhatsAppRepository = {
    findAllAprovados: jest.fn().mockResolvedValue([]),
    upsertPorMetaTemplateId: jest.fn(),
  };

  const whatsAppMessagingService: WhatsAppMessagingService = {
    enviarTexto: jest.fn().mockResolvedValue({ waMessageId: "wamid.texto" }),
    enviarTemplate: jest.fn().mockResolvedValue({ waMessageId: "wamid.template" }),
    enviarMidia: jest.fn().mockResolvedValue({ waMessageId: "wamid.midia" }),
    listarTemplatesAprovados: jest.fn().mockResolvedValue([]),
    baixarMidia: jest.fn(),
  };

  const useCase = new EnviarMensagemUseCase(
    conversaRepository,
    mensagemRepository,
    templateWhatsAppRepository,
    whatsAppMessagingService,
  );

  return {
    useCase,
    conversaRepository,
    mensagemRepository,
    templateWhatsAppRepository,
    whatsAppMessagingService,
  };
}

describe("EnviarMensagemUseCase", () => {
  it("lança NotFoundError se a conversa não existe", async () => {
    const { useCase, conversaRepository } = criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({
        conversaId: "conv-1",
        analistaId: "analista-1",
        tipo: "texto",
        conteudo: "oi",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("envia texto direto quando a janela de 24h está aberta (mensagem recente do cliente)", async () => {
    const mensagemClienteRecente = fakeMensagem({ autor: "cliente" });
    const conversa = fakeConversa({
      mensagens: [
        { ...mensagemClienteRecente, autor: "cliente", createdAt: new Date().toISOString() },
      ],
    });
    const { useCase, mensagemRepository, whatsAppMessagingService, conversaRepository } =
      criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(conversa);

    await useCase.execute({
      conversaId: "conv-1",
      analistaId: "analista-1",
      tipo: "texto",
      conteudo: "Olá! Tudo bem?",
    });

    expect(whatsAppMessagingService.enviarTexto).toHaveBeenCalledWith(
      "5511999999999",
      "Olá! Tudo bem?",
    );
    expect(whatsAppMessagingService.enviarTemplate).not.toHaveBeenCalled();
    expect(mensagemRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conversaId: "conv-1",
        autor: "analista",
        analistaId: "analista-1",
        tipo: "texto",
        conteudo: "Olá! Tudo bem?",
        waMessageId: "wamid.texto",
      }),
    );
    expect(conversaRepository.touchLastMessage).toHaveBeenCalledWith("conv-1", expect.any(Date));
  });

  it("considera a janela fechada quando nunca houve mensagem do cliente", async () => {
    const conversa = fakeConversa({ mensagens: [] });
    const { useCase, conversaRepository, whatsAppMessagingService, templateWhatsAppRepository } =
      criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(conversa);
    (templateWhatsAppRepository.findAllAprovados as jest.Mock).mockResolvedValue([]);

    await expect(
      useCase.execute({
        conversaId: "conv-1",
        analistaId: "a1",
        tipo: "texto",
        conteudo: "qualquer coisa",
      }),
    ).rejects.toThrow(ForaDaJanela24hError);
    expect(whatsAppMessagingService.enviarTexto).not.toHaveBeenCalled();
  });

  it("considera a janela fechada quando a última mensagem do cliente tem mais de 24h", async () => {
    const mensagemAntiga = fakeMensagem({ autor: "cliente" });
    const conversa = fakeConversa({
      mensagens: [
        {
          ...mensagemAntiga,
          autor: "cliente",
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
      ],
    });
    const { useCase, conversaRepository, whatsAppMessagingService, templateWhatsAppRepository } =
      criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(conversa);
    (templateWhatsAppRepository.findAllAprovados as jest.Mock).mockResolvedValue([]);

    await expect(
      useCase.execute({
        conversaId: "conv-1",
        analistaId: "a1",
        tipo: "texto",
        conteudo: "qualquer coisa",
      }),
    ).rejects.toThrow(ForaDaJanela24hError);
    expect(whatsAppMessagingService.enviarTexto).not.toHaveBeenCalled();
  });

  it("com a janela fechada, usa o template quando o conteúdo bate com um aprovado no cache", async () => {
    const conversa = fakeConversa({ mensagens: [] });
    const {
      useCase,
      conversaRepository,
      mensagemRepository,
      whatsAppMessagingService,
      templateWhatsAppRepository,
    } = criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(conversa);
    (templateWhatsAppRepository.findAllAprovados as jest.Mock).mockResolvedValue([
      {
        id: "tpl-1",
        nome: "boas_vindas",
        conteudo: "Olá! Recebemos seu cadastro.",
        idioma: "pt_BR",
      },
    ]);

    await useCase.execute({
      conversaId: "conv-1",
      analistaId: "analista-1",
      tipo: "texto",
      conteudo: "Olá! Recebemos seu cadastro.",
    });

    expect(whatsAppMessagingService.enviarTemplate).toHaveBeenCalledWith(
      "5511999999999",
      "boas_vindas",
      "pt_BR",
    );
    expect(whatsAppMessagingService.enviarTexto).not.toHaveBeenCalled();
    expect(mensagemRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ waMessageId: "wamid.template" }),
    );
  });

  it("lança ForaDaJanela24hError quando a janela está fechada e o texto não bate com nenhum template — não persiste nada", async () => {
    const conversa = fakeConversa({ mensagens: [] });
    const {
      useCase,
      conversaRepository,
      mensagemRepository,
      whatsAppMessagingService,
      templateWhatsAppRepository,
    } = criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(conversa);
    (templateWhatsAppRepository.findAllAprovados as jest.Mock).mockResolvedValue([
      {
        id: "tpl-1",
        nome: "boas_vindas",
        conteudo: "Um texto totalmente diferente",
        idioma: "pt_BR",
      },
    ]);

    await expect(
      useCase.execute({
        conversaId: "conv-1",
        analistaId: "a1",
        tipo: "texto",
        conteudo: "texto livre qualquer",
      }),
    ).rejects.toThrow(ForaDaJanela24hError);

    expect(whatsAppMessagingService.enviarTexto).not.toHaveBeenCalled();
    expect(whatsAppMessagingService.enviarTemplate).not.toHaveBeenCalled();
    expect(mensagemRepository.create).not.toHaveBeenCalled();
    expect(conversaRepository.touchLastMessage).not.toHaveBeenCalled();
  });

  it("não chama a Meta para mensagens de mídia enviadas pelo analista (sem upload real na UI ainda)", async () => {
    const conversa = fakeConversa({ mensagens: [] });
    const { useCase, conversaRepository, mensagemRepository, whatsAppMessagingService } =
      criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(conversa);

    await useCase.execute({
      conversaId: "conv-1",
      analistaId: "analista-1",
      tipo: "pdf",
      conteudo: "documento.pdf",
      tamanhoArquivo: "1.2 MB",
    });

    expect(whatsAppMessagingService.enviarTexto).not.toHaveBeenCalled();
    expect(whatsAppMessagingService.enviarTemplate).not.toHaveBeenCalled();
    expect(whatsAppMessagingService.enviarMidia).not.toHaveBeenCalled();
    expect(mensagemRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "pdf", conteudo: "documento.pdf", waMessageId: undefined }),
    );
  });
});
