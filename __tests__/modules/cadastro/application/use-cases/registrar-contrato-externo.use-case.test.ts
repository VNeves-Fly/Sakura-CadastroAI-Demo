import { RegistrarContratoExternoUseCase } from "@/modules/cadastro/application/use-cases/registrar-contrato-externo.use-case";
import type { ProcessarWebhookD4SignUseCase } from "@/modules/cadastro/application/use-cases/processar-webhook-d4sign.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { Contrato } from "@/modules/cadastro/domain/entities/contrato.entity";
import type { ContratoRepository } from "@/modules/cadastro/domain/repositories/contrato-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";

function fakeContratoRepository(overrides: Partial<ContratoRepository> = {}): ContratoRepository {
  return {
    findById: jest.fn(),
    findByAgenciaId: jest.fn(),
    create: jest.fn(),
    atualizarStatus: jest.fn(),
    confirmarLeitura: jest.fn(),
    registrarAssinatura: jest.fn(),
    atualizarProvedorId: jest.fn(),
    ...overrides,
  };
}

function paraDestinatarios(
  emails: string[],
): Array<{ email: string; assinado: null; assinadoEm: null }> {
  return emails.map((email) => ({ email, assinado: null, assinadoEm: null }));
}

function fakeContratoAssinaturaService(
  overrides: Partial<ContratoAssinaturaService> = {},
): ContratoAssinaturaService {
  return {
    gerarEEnviar: jest.fn(),
    visualizarDocumento: jest.fn(),
    obterDocumento: jest.fn().mockResolvedValue({
      existe: true,
      nomeDocumento: "Contrato Teste",
      statusName: "Aguardando Assinaturas",
    }),
    obterDestinatarios: jest.fn().mockResolvedValue([]),
    registrarWebhook: jest.fn().mockResolvedValue({ registrado: true }),
    cancelarDocumento: jest.fn(),
    obterLinkAssinatura: jest.fn(),
    ...overrides,
  };
}

function fakeProcessarWebhookD4SignUseCase(
  execute: jest.Mock = jest.fn().mockResolvedValue({ processado: true }),
): ProcessarWebhookD4SignUseCase {
  return { execute } as unknown as ProcessarWebhookD4SignUseCase;
}

const CONTRATO = Contrato.create({
  id: "ct-1",
  agenciaId: "ag-1",
  provedorId: "doc-antigo",
  status: "aguardando_assinatura",
  origemGeracao: "ia",
  numContrato: null,
  conteudoPreenchido: null,
  leituraConfirmada: false,
  leituraConfirmadaPor: null,
  leituraConfirmadaEm: null,
  contratoGcsPath: null,
  pdfAssinadoGcsPath: null,
  assinadoAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("RegistrarContratoExternoUseCase", () => {
  it("lança NotFoundError se o contrato local não existe", async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(null),
    });
    const useCase = new RegistrarContratoExternoUseCase(
      contratoRepository,
      fakeContratoAssinaturaService(),
      fakeProcessarWebhookD4SignUseCase(),
    );

    await expect(
      useCase.execute({
        contratoId: "ct-inexistente",
        provedorId: "doc-novo",
        emailsEsperados: [],
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("retorna ok:false sem persistir nada se o documento não existe no D4Sign", async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(CONTRATO),
    });
    const contratoAssinaturaService = fakeContratoAssinaturaService({
      obterDocumento: jest
        .fn()
        .mockResolvedValue({ existe: false, nomeDocumento: null, statusName: null }),
    });
    const useCase = new RegistrarContratoExternoUseCase(
      contratoRepository,
      contratoAssinaturaService,
      fakeProcessarWebhookD4SignUseCase(),
    );

    const resultado = await useCase.execute({
      contratoId: "ct-1",
      provedorId: "doc-novo",
      emailsEsperados: ["socio@agencia.com"],
    });

    expect(resultado).toEqual({
      ok: false,
      motivo: expect.stringContaining("não encontrado no D4Sign"),
    });
    expect(contratoAssinaturaService.obterDestinatarios).not.toHaveBeenCalled();
    expect(contratoRepository.atualizarProvedorId).not.toHaveBeenCalled();
  });

  it("bloqueia (ok:false) se nenhum destinatário do documento bate com os e-mails esperados", async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(CONTRATO),
    });
    const contratoAssinaturaService = fakeContratoAssinaturaService({
      obterDestinatarios: jest
        .fn()
        .mockResolvedValue(paraDestinatarios(["outra-pessoa@outraempresa.com"])),
    });
    const useCase = new RegistrarContratoExternoUseCase(
      contratoRepository,
      contratoAssinaturaService,
      fakeProcessarWebhookD4SignUseCase(),
    );

    const resultado = await useCase.execute({
      contratoId: "ct-1",
      provedorId: "doc-novo",
      emailsEsperados: ["socio@agencia.com", "cadastro@sakuratur.com.br"],
    });

    expect(resultado).toEqual({
      ok: false,
      motivo: expect.stringContaining("não batem"),
    });
    expect(contratoAssinaturaService.registrarWebhook).not.toHaveBeenCalled();
    expect(contratoRepository.atualizarProvedorId).not.toHaveBeenCalled();
  });

  it("segue com aviso (não bloqueia) quando só parte dos e-mails esperados aparece nos destinatários", async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(CONTRATO),
    });
    const contratoAssinaturaService = fakeContratoAssinaturaService({
      obterDestinatarios: jest.fn().mockResolvedValue(paraDestinatarios(["socio@agencia.com"])),
    });
    const useCase = new RegistrarContratoExternoUseCase(
      contratoRepository,
      contratoAssinaturaService,
      fakeProcessarWebhookD4SignUseCase(),
    );

    const resultado = await useCase.execute({
      contratoId: "ct-1",
      provedorId: "doc-novo",
      emailsEsperados: ["socio@agencia.com", "cadastro@sakuratur.com.br"],
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.avisos).toEqual([expect.stringContaining("cadastro@sakuratur.com.br")]);
    }
    expect(contratoRepository.atualizarProvedorId).toHaveBeenCalledWith("ct-1", {
      provedorId: "doc-novo",
      origemGeracao: "externo",
    });
  });

  it("não valida destinatários quando não há e-mails esperados (agência sem sócios carregados)", async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(CONTRATO),
    });
    const contratoAssinaturaService = fakeContratoAssinaturaService({
      obterDestinatarios: jest.fn().mockResolvedValue(paraDestinatarios(["qualquer@coisa.com"])),
    });
    const useCase = new RegistrarContratoExternoUseCase(
      contratoRepository,
      contratoAssinaturaService,
      fakeProcessarWebhookD4SignUseCase(),
    );

    const resultado = await useCase.execute({
      contratoId: "ct-1",
      provedorId: "doc-novo",
      emailsEsperados: [],
    });

    expect(resultado.ok).toBe(true);
    expect(contratoRepository.atualizarProvedorId).toHaveBeenCalled();
  });

  it("avisa quando o webhook não foi registrado (sem D4SIGN_WEBHOOK_URL no ambiente)", async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(CONTRATO),
    });
    const contratoAssinaturaService = fakeContratoAssinaturaService({
      registrarWebhook: jest.fn().mockResolvedValue({ registrado: false }),
    });
    const useCase = new RegistrarContratoExternoUseCase(
      contratoRepository,
      contratoAssinaturaService,
      fakeProcessarWebhookD4SignUseCase(),
    );

    const resultado = await useCase.execute({
      contratoId: "ct-1",
      provedorId: "doc-novo",
      emailsEsperados: [],
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.webhookRegistrado).toBe(false);
      expect(resultado.avisos).toEqual([expect.stringContaining("Webhook não registrado")]);
    }
  });

  it('reaproveita ProcessarWebhookD4SignUseCase (typePost "1") quando o documento já chega finalizado', async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(CONTRATO),
    });
    const contratoAssinaturaService = fakeContratoAssinaturaService({
      obterDocumento: jest.fn().mockResolvedValue({
        existe: true,
        nomeDocumento: "Contrato Teste",
        statusName: "Finalizado",
      }),
    });
    const execute = jest.fn().mockResolvedValue({ processado: true });
    const useCase = new RegistrarContratoExternoUseCase(
      contratoRepository,
      contratoAssinaturaService,
      fakeProcessarWebhookD4SignUseCase(execute),
    );

    await useCase.execute({ contratoId: "ct-1", provedorId: "doc-novo", emailsEsperados: [] });

    expect(execute).toHaveBeenCalledWith({ provedorId: "doc-novo", typePost: "1" });
  });

  it("não chama o backfill quando o documento ainda está aguardando assinaturas", async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(CONTRATO),
    });
    const execute = jest.fn();
    const useCase = new RegistrarContratoExternoUseCase(
      contratoRepository,
      fakeContratoAssinaturaService(),
      fakeProcessarWebhookD4SignUseCase(execute),
    );

    await useCase.execute({ contratoId: "ct-1", provedorId: "doc-novo", emailsEsperados: [] });

    expect(execute).not.toHaveBeenCalled();
  });

  it("não falha a operação toda se o backfill der erro — já persistiu o que importa", async () => {
    const contratoRepository = fakeContratoRepository({
      findById: jest.fn().mockResolvedValue(CONTRATO),
    });
    const contratoAssinaturaService = fakeContratoAssinaturaService({
      obterDocumento: jest.fn().mockResolvedValue({
        existe: true,
        nomeDocumento: "Contrato Teste",
        statusName: "Finalizado",
      }),
    });
    const execute = jest.fn().mockRejectedValue(new Error("agência não estava pronta"));
    const useCase = new RegistrarContratoExternoUseCase(
      contratoRepository,
      contratoAssinaturaService,
      fakeProcessarWebhookD4SignUseCase(execute),
    );

    const resultado = await useCase.execute({
      contratoId: "ct-1",
      provedorId: "doc-novo",
      emailsEsperados: [],
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.avisos.some((aviso) => aviso.includes("não deu pra atualizar"))).toBe(true);
    }
    expect(contratoRepository.atualizarProvedorId).toHaveBeenCalled();
  });
});
