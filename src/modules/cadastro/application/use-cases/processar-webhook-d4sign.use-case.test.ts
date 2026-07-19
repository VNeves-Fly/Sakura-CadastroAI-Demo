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
    create: async () => {
      throw new Error("create não implementado no fake de teste");
    },
  };
}

const JEAN = SignatarioPadrao.create({
  id: "sig-jean",
  nome: "Jean",
  cargo: "Time Cadastro",
  email: "cadastro@sakuratur.com.br",
  telefone: null,
  ativo: true,
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
  ativo: true,
  ordem: 3,
  papel: "ASSINAR_COMO_TESTEMUNHA",
  estagio: 2,
});

describe("ProcessarWebhookD4SignUseCase", () => {
  it('ignora eventos que não são "documento finalizado" nem assinatura individual (typePost != "1"/"4")', async () => {
    const repo = criarRepositorioFake();
    const useCase = new ProcessarWebhookD4SignUseCase(repo, fakeSignatarioPadraoRepository());

    const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "2" });

    expect(resultado).toEqual({
      processado: false,
      motivo: expect.stringContaining('typePost "2"'),
    });
    expect(repo.findByContratoProvedorId).not.toHaveBeenCalled();
  });

  it("não faz nada se o provedorId não corresponde a nenhum contrato conhecido", async () => {
    const repo = criarRepositorioFake({
      findByContratoProvedorId: jest.fn().mockResolvedValue(null),
    });
    const useCase = new ProcessarWebhookD4SignUseCase(repo, fakeSignatarioPadraoRepository());

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
    const useCase = new ProcessarWebhookD4SignUseCase(repo, fakeSignatarioPadraoRepository());

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
    const useCase = new ProcessarWebhookD4SignUseCase(repo, fakeSignatarioPadraoRepository());

    const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "1" });

    expect(repo.atualizarStatusContrato).toHaveBeenCalledWith("ct-1", CONTRATO_STATUS_ASSINADO);
    expect(repo.atualizarStatus).toHaveBeenCalledWith("ag-1", STATUS_AGUARDANDO_VALIDACAO);
    expect(resultado).toEqual({ processado: true });
  });

  describe('aprovação intermediária (typePost "4")', () => {
    it("ignora assinatura individual sem e-mail", async () => {
      const repo = criarRepositorioFake();
      const useCase = new ProcessarWebhookD4SignUseCase(repo, fakeSignatarioPadraoRepository());

      const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "4" });

      expect(resultado.processado).toBe(false);
      expect(repo.findByContratoProvedorId).not.toHaveBeenCalled();
    });

    it("ignora assinatura individual de quem não é o aprovador (ex.: testemunha)", async () => {
      const repo = criarRepositorioFake();
      const useCase = new ProcessarWebhookD4SignUseCase(
        repo,
        fakeSignatarioPadraoRepository([JEAN, WAGNER]),
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
    const useCase = new ProcessarWebhookD4SignUseCase(repo, fakeSignatarioPadraoRepository());

    const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "1" });

    expect(repo.atualizarStatusContrato).toHaveBeenCalledWith("ct-1", CONTRATO_STATUS_ASSINADO);
    expect(repo.atualizarStatus).toHaveBeenCalledWith("ag-1", STATUS_AGUARDANDO_VALIDACAO);
    expect(resultado).toEqual({ processado: true });
  });
});
