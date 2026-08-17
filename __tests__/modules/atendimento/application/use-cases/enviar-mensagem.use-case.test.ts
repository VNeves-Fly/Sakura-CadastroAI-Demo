import { EnviarMensagemUseCase } from "@/modules/atendimento/application/use-cases/enviar-mensagem.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { ForaDaJanela24hError } from "@/modules/atendimento/domain/errors";
import type { CriarMensagemData } from "@/modules/atendimento/domain/repositories/mensagem-repository";
import type { MensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";
import {
  fakeAtendimentoAgenciaRepository,
  fakeConversa,
  fakeConversaRepository,
  fakeMensagemRepository,
  fakeTemplateWhatsAppRepository,
  fakeWhatsAppMessagingService,
} from "../../fixtures";

// agenciaId: null em todo fakeConversa deste arquivo — testa a lógica de
// envio (template/janela 24h), não a trava de atendimento assumido (só
// vale pra conversa vinculada a agência, ver EnviarMensagemUseCase).

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
  const conversaRepository = fakeConversaRepository();
  const mensagemRepository = fakeMensagemRepository({
    create: jest
      .fn()
      .mockImplementation((data: CriarMensagemData) => Promise.resolve(fakeMensagem(data))),
  });
  const templateWhatsAppRepository = fakeTemplateWhatsAppRepository({
    findAllAprovados: jest.fn().mockResolvedValue([]),
  });
  const whatsAppMessagingService = fakeWhatsAppMessagingService();
  const atendimentoAgenciaRepository = fakeAtendimentoAgenciaRepository();

  const useCase = new EnviarMensagemUseCase(
    conversaRepository,
    mensagemRepository,
    templateWhatsAppRepository,
    whatsAppMessagingService,
    atendimentoAgenciaRepository,
  );

  return {
    useCase,
    conversaRepository,
    mensagemRepository,
    templateWhatsAppRepository,
    whatsAppMessagingService,
    atendimentoAgenciaRepository,
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
      agenciaId: null,
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
    const conversa = fakeConversa({ agenciaId: null, mensagens: [] });
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
      agenciaId: null,
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

  it("com a janela fechada, usa o template pelo templateId e manda as variáveis pra Meta", async () => {
    const conversa = fakeConversa({ agenciaId: null, mensagens: [] });
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
        titulo: null,
        conteudo: "Olá {{1}}! Recebemos seu cadastro.",
        categoria: "UTILITY",
        idioma: "pt_BR",
        status: "aprovado",
        ativo: true,
        motivoRejeicao: null,
        criadoEm: "2026-01-01T00:00:00.000Z",
      },
    ]);

    await useCase.execute({
      conversaId: "conv-1",
      analistaId: "analista-1",
      tipo: "texto",
      conteudo: "Olá Fulano! Recebemos seu cadastro.",
      templateId: "tpl-1",
      variaveis: ["Fulano"],
    });

    expect(whatsAppMessagingService.enviarTemplate).toHaveBeenCalledWith(
      "5511999999999",
      "boas_vindas",
      "pt_BR",
      ["Fulano"],
    );
    expect(whatsAppMessagingService.enviarTexto).not.toHaveBeenCalled();
    expect(mensagemRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ waMessageId: "wamid.template" }),
    );
  });

  it("lança ForaDaJanela24hError quando a janela está fechada e não veio templateId — não persiste nada", async () => {
    const conversa = fakeConversa({ agenciaId: null, mensagens: [] });
    const { useCase, conversaRepository, mensagemRepository, whatsAppMessagingService } =
      criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(conversa);

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

  it("lança ForaDaJanela24hError quando o templateId não bate com nenhum template aprovado", async () => {
    const conversa = fakeConversa({ agenciaId: null, mensagens: [] });
    const { useCase, conversaRepository, mensagemRepository, templateWhatsAppRepository } =
      criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(conversa);
    (templateWhatsAppRepository.findAllAprovados as jest.Mock).mockResolvedValue([]);

    await expect(
      useCase.execute({
        conversaId: "conv-1",
        analistaId: "a1",
        tipo: "texto",
        conteudo: "texto qualquer",
        templateId: "tpl-inexistente",
      }),
    ).rejects.toThrow(ForaDaJanela24hError);

    expect(mensagemRepository.create).not.toHaveBeenCalled();
  });

  it("não chama a Meta para mensagens de mídia enviadas pelo analista (sem upload real na UI ainda)", async () => {
    const conversa = fakeConversa({ agenciaId: null, mensagens: [] });
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
