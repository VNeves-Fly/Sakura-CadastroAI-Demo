import { ProcessarWebhookD4SignUseCase } from "@/modules/cadastro/application/use-cases/processar-webhook-d4sign.use-case";
import {
  CONTRATO_STATUS_ASSINADO,
  CONTRATO_STATUS_ASSINADO_AGENCIA,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";
import type { ContratoEmailFalhaEntregaRepository } from "@/modules/cadastro/domain/repositories/contrato-email-falha-entrega-repository";

function criarRepositorioFake(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findByCnpj: jest.fn(),
    findByContratoProvedorId: jest.fn(),
    obterDetalhe: jest.fn(),
    create: jest.fn(),
    atualizarStatus: jest.fn(),
    criarContrato: jest.fn(),
    atualizarStatusContrato: jest.fn(),
    listar: jest.fn(),
    obterKpis: jest.fn(),
    obterAnaliseContratos: jest.fn(),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function fakeSignatarioPadraoRepository(
  signatarios: SignatarioPadrao[] = [],
): SignatarioPadraoRepository {
  return {
    findAll: async () => signatarios,
    findAtivos: async () => signatarios,
    findById: async () => {
      throw new Error("findById não implementado no fake de teste");
    },
    create: async () => {
      throw new Error("create não implementado no fake de teste");
    },
    update: async () => {
      throw new Error("update não implementado no fake de teste");
    },
    softDelete: async () => {
      throw new Error("softDelete não implementado no fake de teste");
    },
    restaurar: async () => {
      throw new Error("restaurar não implementado no fake de teste");
    },
  };
}

function fakeContratoEmailFalhaEntregaRepository(
  overrides: Partial<ContratoEmailFalhaEntregaRepository> = {},
): ContratoEmailFalhaEntregaRepository {
  return {
    registrar: jest.fn(),
    findByContratoId: jest.fn(),
    ...overrides,
  } as unknown as ContratoEmailFalhaEntregaRepository;
}

const JEAN = SignatarioPadrao.create({
  id: "sig-jean",
  nome: "Jean",
  cargo: "Time Cadastro",
  email: "cadastro@sakuratur.com.br",
  telefone: null,
  deletedAt: null,
  ordem: 1,
  papel: "APROVAR",
  estagio: 1,
});

const WAGNER = SignatarioPadrao.create({
  id: "sig-wagner",
  nome: "Wagner Chaves",
  cargo: "Sakura",
  email: "wagner.chaves@sakuratur.com.br",
  telefone: null,
  deletedAt: null,
  ordem: 3,
  papel: "ASSINAR_COMO_TESTEMUNHA",
  estagio: 2,
});

describe("ProcessarWebhookD4SignUseCase", () => {
  it('ignora eventos sem transição definida (typePost "3" — cancelado)', async () => {
    const repo = criarRepositorioFake();
    const useCase = new ProcessarWebhookD4SignUseCase(
      repo,
      fakeSignatarioPadraoRepository(),
      fakeContratoEmailFalhaEntregaRepository(),
    );

    const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "3" });

    expect(resultado).toEqual({
      processado: false,
      motivo: expect.stringContaining('typePost "3"'),
    });
    expect(repo.findByContratoProvedorId).not.toHaveBeenCalled();
  });

  it("não faz nada se o provedorId não corresponde a nenhum contrato conhecido", async () => {
    const repo = criarRepositorioFake({
      findByContratoProvedorId: jest.fn().mockResolvedValue(null),
    });
    const useCase = new ProcessarWebhookD4SignUseCase(
      repo,
      fakeSignatarioPadraoRepository(),
      fakeContratoEmailFalhaEntregaRepository(),
    );

    const resultado = await useCase.execute({ provedorId: "doc-desconhecido", typePost: "1" });

    expect(resultado.processado).toBe(false);
    expect(repo.atualizarStatusContrato).not.toHaveBeenCalled();
  });

  it("não avança se a agência não está aguardando assinatura", async () => {
    const repo = criarRepositorioFake({
      findByContratoProvedorId: jest
        .fn()
        .mockResolvedValue({ agenciaId: "ag-1", contratoId: "ct-1" }),
      obterDetalhe: jest
        .fn()
        .mockResolvedValue({ agencia: { status: STATUS_EM_COMPLEMENTAR } } as never),
    });
    const useCase = new ProcessarWebhookD4SignUseCase(
      repo,
      fakeSignatarioPadraoRepository(),
      fakeContratoEmailFalhaEntregaRepository(),
    );

    const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "1" });

    expect(resultado.processado).toBe(false);
    expect(repo.atualizarStatusContrato).not.toHaveBeenCalled();
    expect(repo.atualizarStatus).not.toHaveBeenCalled();
  });

  it("avança contrato pra assinado e agência pra aguardando_validacao quando tudo bate", async () => {
    const repo = criarRepositorioFake({
      findByContratoProvedorId: jest
        .fn()
        .mockResolvedValue({ agenciaId: "ag-1", contratoId: "ct-1" }),
      obterDetalhe: jest
        .fn()
        .mockResolvedValue({ agencia: { status: STATUS_AGUARDANDO_ASSINATURA } } as never),
    });
    const useCase = new ProcessarWebhookD4SignUseCase(
      repo,
      fakeSignatarioPadraoRepository(),
      fakeContratoEmailFalhaEntregaRepository(),
    );

    const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "1" });

    expect(repo.atualizarStatusContrato).toHaveBeenCalledWith("ct-1", CONTRATO_STATUS_ASSINADO);
    expect(repo.atualizarStatus).toHaveBeenCalledWith("ag-1", STATUS_AGUARDANDO_VALIDACAO);
    expect(resultado).toEqual({ processado: true });
  });

  describe('e-mail não entregue (typePost "2")', () => {
    it("ignora evento sem e-mail", async () => {
      const repo = criarRepositorioFake();
      const emailFalhaRepo = fakeContratoEmailFalhaEntregaRepository();
      const useCase = new ProcessarWebhookD4SignUseCase(
        repo,
        fakeSignatarioPadraoRepository(),
        emailFalhaRepo,
      );

      const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "2" });

      expect(resultado.processado).toBe(false);
      expect(emailFalhaRepo.registrar).not.toHaveBeenCalled();
    });

    it("não faz nada se o provedorId não corresponde a nenhum contrato conhecido", async () => {
      const repo = criarRepositorioFake({
        findByContratoProvedorId: jest.fn().mockResolvedValue(null),
      });
      const emailFalhaRepo = fakeContratoEmailFalhaEntregaRepository();
      const useCase = new ProcessarWebhookD4SignUseCase(
        repo,
        fakeSignatarioPadraoRepository(),
        emailFalhaRepo,
      );

      const resultado = await useCase.execute({
        provedorId: "doc-desconhecido",
        typePost: "2",
        email: "socio@agencia.com",
      });

      expect(resultado.processado).toBe(false);
      expect(emailFalhaRepo.registrar).not.toHaveBeenCalled();
    });

    it("registra a falha de entrega com o motivo, sem mexer em status de contrato/agência", async () => {
      const repo = criarRepositorioFake({
        findByContratoProvedorId: jest
          .fn()
          .mockResolvedValue({ agenciaId: "ag-1", contratoId: "ct-1" }),
      });
      const emailFalhaRepo = fakeContratoEmailFalhaEntregaRepository();
      const useCase = new ProcessarWebhookD4SignUseCase(
        repo,
        fakeSignatarioPadraoRepository(),
        emailFalhaRepo,
      );

      const resultado = await useCase.execute({
        provedorId: "doc-1",
        typePost: "2",
        email: "socio@agencia.com",
        message: "Caixa de entrada cheia",
      });

      expect(emailFalhaRepo.registrar).toHaveBeenCalledWith(
        "ct-1",
        "socio@agencia.com",
        "Caixa de entrada cheia",
      );
      expect(repo.atualizarStatusContrato).not.toHaveBeenCalled();
      expect(repo.atualizarStatus).not.toHaveBeenCalled();
      expect(resultado).toEqual({ processado: true });
    });

    it("registra a falha de entrega mesmo sem motivo (message ausente)", async () => {
      const repo = criarRepositorioFake({
        findByContratoProvedorId: jest
          .fn()
          .mockResolvedValue({ agenciaId: "ag-1", contratoId: "ct-1" }),
      });
      const emailFalhaRepo = fakeContratoEmailFalhaEntregaRepository();
      const useCase = new ProcessarWebhookD4SignUseCase(
        repo,
        fakeSignatarioPadraoRepository(),
        emailFalhaRepo,
      );

      await useCase.execute({
        provedorId: "doc-1",
        typePost: "2",
        email: "socio@agencia.com",
      });

      expect(emailFalhaRepo.registrar).toHaveBeenCalledWith("ct-1", "socio@agencia.com", null);
    });
  });

  describe('aprovação intermediária (typePost "4")', () => {
    it("ignora assinatura individual sem e-mail", async () => {
      const repo = criarRepositorioFake();
      const useCase = new ProcessarWebhookD4SignUseCase(
        repo,
        fakeSignatarioPadraoRepository(),
        fakeContratoEmailFalhaEntregaRepository(),
      );

      const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "4" });

      expect(resultado.processado).toBe(false);
      expect(repo.findByContratoProvedorId).not.toHaveBeenCalled();
    });

    it("ignora assinatura individual de quem não é o aprovador (ex.: testemunha)", async () => {
      const repo = criarRepositorioFake();
      const useCase = new ProcessarWebhookD4SignUseCase(
        repo,
        fakeSignatarioPadraoRepository([JEAN, WAGNER]),
        fakeContratoEmailFalhaEntregaRepository(),
      );

      const resultado = await useCase.execute({
        provedorId: "doc-1",
        typePost: "4",
        email: "wagner.chaves@sakuratur.com.br",
      });

      expect(resultado).toEqual({
        processado: false,
        motivo: expect.stringContaining("não é do aprovador"),
      });
      expect(repo.findByContratoProvedorId).not.toHaveBeenCalled();
    });

    it("avança contrato pra assinado_agencia e agência pra aguardando_validacao quando o aprovador assina, sem esperar os demais", async () => {
      const repo = criarRepositorioFake({
        findByContratoProvedorId: jest
          .fn()
          .mockResolvedValue({ agenciaId: "ag-1", contratoId: "ct-1" }),
        obterDetalhe: jest.fn().mockResolvedValue({
          agencia: { status: STATUS_AGUARDANDO_ASSINATURA },
          contratos: [{ id: "ct-1", status: STATUS_AGUARDANDO_ASSINATURA }],
        } as never),
      });
      const useCase = new ProcessarWebhookD4SignUseCase(
        repo,
        fakeSignatarioPadraoRepository([JEAN, WAGNER]),
        fakeContratoEmailFalhaEntregaRepository(),
      );

      const resultado = await useCase.execute({
        provedorId: "doc-1",
        typePost: "4",
        email: "cadastro@sakuratur.com.br",
      });

      expect(repo.atualizarStatusContrato).toHaveBeenCalledWith(
        "ct-1",
        CONTRATO_STATUS_ASSINADO_AGENCIA,
      );
      expect(repo.atualizarStatus).toHaveBeenCalledWith("ag-1", STATUS_AGUARDANDO_VALIDACAO);
      expect(resultado).toEqual({ processado: true });
    });

    it("não regride o contrato pra assinado_agencia se o documento já finalizou por baixo (corrida entre os dois webhooks)", async () => {
      const repo = criarRepositorioFake({
        findByContratoProvedorId: jest
          .fn()
          .mockResolvedValue({ agenciaId: "ag-1", contratoId: "ct-1" }),
        // Cenário de corrida: processarDocumentoFinalizado já gravou
        // contrato.status = assinado, mas ainda não gravou agencia.status
        // (as duas escritas não são atômicas) — a leitura aqui pega a
        // agência "no meio do caminho".
        obterDetalhe: jest.fn().mockResolvedValue({
          agencia: { status: STATUS_AGUARDANDO_ASSINATURA },
          contratos: [{ id: "ct-1", status: CONTRATO_STATUS_ASSINADO }],
        } as never),
      });
      const useCase = new ProcessarWebhookD4SignUseCase(
        repo,
        fakeSignatarioPadraoRepository([JEAN]),
        fakeContratoEmailFalhaEntregaRepository(),
      );

      const resultado = await useCase.execute({
        provedorId: "doc-1",
        typePost: "4",
        email: "cadastro@sakuratur.com.br",
      });

      expect(resultado).toEqual({
        processado: false,
        motivo: expect.stringContaining("já finalizado"),
      });
      expect(repo.atualizarStatusContrato).not.toHaveBeenCalled();
      expect(repo.atualizarStatus).not.toHaveBeenCalled();
    });

    it("não avança de novo se o aprovador já avançou a agência antes (idempotente/retry do D4Sign)", async () => {
      const repo = criarRepositorioFake({
        findByContratoProvedorId: jest
          .fn()
          .mockResolvedValue({ agenciaId: "ag-1", contratoId: "ct-1" }),
        obterDetalhe: jest
          .fn()
          .mockResolvedValue({ agencia: { status: STATUS_AGUARDANDO_VALIDACAO } } as never),
      });
      const useCase = new ProcessarWebhookD4SignUseCase(
        repo,
        fakeSignatarioPadraoRepository([JEAN]),
        fakeContratoEmailFalhaEntregaRepository(),
      );

      const resultado = await useCase.execute({
        provedorId: "doc-1",
        typePost: "4",
        email: "cadastro@sakuratur.com.br",
      });

      expect(resultado.processado).toBe(false);
      expect(repo.atualizarStatusContrato).not.toHaveBeenCalled();
    });
  });

  it("fecha o contrato como assinado quando o documento finaliza depois da aprovação intermediária (agência já em aguardando_validacao)", async () => {
    const repo = criarRepositorioFake({
      findByContratoProvedorId: jest
        .fn()
        .mockResolvedValue({ agenciaId: "ag-1", contratoId: "ct-1" }),
      obterDetalhe: jest
        .fn()
        .mockResolvedValue({ agencia: { status: STATUS_AGUARDANDO_VALIDACAO } } as never),
    });
    const useCase = new ProcessarWebhookD4SignUseCase(
      repo,
      fakeSignatarioPadraoRepository(),
      fakeContratoEmailFalhaEntregaRepository(),
    );

    const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "1" });

    expect(repo.atualizarStatusContrato).toHaveBeenCalledWith("ct-1", CONTRATO_STATUS_ASSINADO);
    expect(repo.atualizarStatus).toHaveBeenCalledWith("ag-1", STATUS_AGUARDANDO_VALIDACAO);
    expect(resultado).toEqual({ processado: true });
  });
});
