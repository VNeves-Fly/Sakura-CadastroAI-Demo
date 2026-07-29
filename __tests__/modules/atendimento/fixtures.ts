import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { AssumirAtendimentoRepository } from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { MensagemRepository } from "@/modules/atendimento/domain/repositories/mensagem-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import type { SolicitacaoTransferenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";
import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type { TextoProntoRepository } from "@/modules/atendimento/domain/repositories/texto-pronto-repository";
import type { WhatsAppMessagingService } from "@/modules/atendimento/domain/services/whatsapp-messaging-service";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";

// Fixtures/fakes compartilhados pelos testes do módulo atendimento — cada
// interface de repositório/serviço tem um fake aqui pra não duplicar a
// mesma lista de campos em toda use-case test.

export function fakeConversa(overrides: Partial<ConversaEntity> = {}): ConversaEntity {
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
    solicitacaoTransferenciaPendente: null,
    resumoFicha: {
      statusAgencia: "em_andamento",
      documentosAprovados: 0,
      documentosPendentes: 0,
      documentosParaRevisar: [],
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

export function fakeAssumirAtendimentoRepository(
  overrides: Partial<AssumirAtendimentoRepository> = {},
): AssumirAtendimentoRepository {
  return {
    findAtual: jest.fn().mockResolvedValue(null),
    criar: jest.fn().mockResolvedValue({
      analistaNome: "Ana Analista",
      assumidoEm: "2026-01-02T00:00:00.000Z",
      liberadoEm: null,
    }),
    liberar: jest.fn(),
    listarAtivosPorAgencias: jest.fn().mockResolvedValue([]),
    listarUltimoEncerradoPorAgencias: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

export function fakeAtendimentoAgenciaRepository(
  overrides: Partial<AtendimentoAgenciaRepository> = {},
): AtendimentoAgenciaRepository {
  return {
    findAtual: jest.fn().mockResolvedValue(null),
    criar: jest.fn().mockResolvedValue(undefined),
    liberar: jest.fn(),
    listarHistorico: jest.fn().mockResolvedValue([]),
    listarAtivosPorAgencias: jest.fn().mockResolvedValue([]),
    listarUltimoEncerradoPorAgencias: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

export function fakeConversaRepository(
  overrides: Partial<ConversaRepository> = {},
): ConversaRepository {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(fakeConversa()),
    findByTelefoneWhatsapp: jest.fn().mockResolvedValue(null),
    findAllByAgenciaId: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    touchLastMessage: jest.fn(),
    ...overrides,
  };
}

export function fakeResumoFichaClienteRepository(
  overrides: Partial<ResumoFichaClienteRepository> = {},
): ResumoFichaClienteRepository {
  return {
    obterResumo: jest.fn().mockResolvedValue({
      statusAgencia: "ativo",
      documentosAprovados: 3,
      documentosPendentes: 0,
      situacaoCadastralReceita: "ATIVA",
      contratoStatus: "assinado",
      amatSofiaConsultado: true,
    }),
    ...overrides,
  };
}

export function fakeSolicitacaoTransferenciaRepository(
  overrides: Partial<SolicitacaoTransferenciaRepository> = {},
): SolicitacaoTransferenciaRepository {
  return {
    findVisivelPorConversa: jest.fn().mockResolvedValue(null),
    findPendentePorConversa: jest.fn().mockResolvedValue(null),
    criar: jest.fn().mockResolvedValue({
      id: "transf-1",
      conversaId: "conv-1",
      deAnalista: "Ana Analista",
      paraAnalista: "Outro Analista",
      status: "pendente",
      criadaEm: "2026-01-01T00:00:00.000Z",
    }),
    aceitar: jest.fn(),
    recusar: jest.fn(),
    limpar: jest.fn(),
    ...overrides,
  };
}

export function fakeMensagemRepository(
  overrides: Partial<MensagemRepository> = {},
): MensagemRepository {
  return {
    create: jest.fn(),
    criarMidia: jest.fn(),
    findMidiaById: jest.fn(),
    marcarClienteComoLidas: jest.fn(),
    findByWaMessageId: jest.fn().mockResolvedValue(null),
    atualizarStatusPorWaMessageId: jest.fn(),
    ...overrides,
  };
}

export function fakeTemplateWhatsAppRepository(
  overrides: Partial<TemplateWhatsAppRepository> = {},
): TemplateWhatsAppRepository {
  return {
    findAllAprovados: jest.fn().mockResolvedValue([]),
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    obterMetaTemplateId: jest.fn().mockResolvedValue(null),
    criarLocal: jest.fn(),
    atualizarAposReenvio: jest.fn(),
    atualizarMetadata: jest.fn(),
    upsertPorMetaTemplateId: jest.fn(),
    ...overrides,
  };
}

export function fakeTextoProntoRepository(
  overrides: Partial<TextoProntoRepository> = {},
): TextoProntoRepository {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
    remover: jest.fn(),
    ...overrides,
  };
}

export function fakeWhatsAppMessagingService(
  overrides: Partial<WhatsAppMessagingService> = {},
): WhatsAppMessagingService {
  return {
    enviarTexto: jest.fn().mockResolvedValue({ waMessageId: "wamid.texto" }),
    enviarTemplate: jest.fn().mockResolvedValue({ waMessageId: "wamid.template" }),
    enviarMidia: jest.fn().mockResolvedValue({ waMessageId: "wamid.midia" }),
    listarTemplatesAprovados: jest.fn().mockResolvedValue([]),
    listarTodosTemplates: jest.fn().mockResolvedValue([]),
    criarTemplate: jest.fn().mockResolvedValue({ metaTemplateId: "meta-tpl-1" }),
    editarTemplate: jest.fn(),
    baixarMidia: jest.fn(),
    verificarCredenciais: jest
      .fn()
      .mockResolvedValue({ displayPhoneNumber: "+55 11 99999-9999", verifiedName: "Sakura" }),
    ...overrides,
  };
}

export function fakeUserRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findById: jest.fn().mockResolvedValue({ id: "user-2", name: "Outro Analista" }),
    findByEmail: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    updatePassword: jest.fn(),
    ...overrides,
  } as unknown as UserRepository;
}
