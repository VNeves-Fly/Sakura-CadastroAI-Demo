import { CancelarContratoUseCase } from "@/modules/cadastro/application/use-cases/cancelar-contrato.use-case";
import {
  CONTRATO_PROVEDOR_ID_PENDENTE,
  CONTRATO_STATUS_CANCELADO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_ATIVO,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { HistoricoEdicaoCadastroRepository } from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";

function fakeAgenciaRepository(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findByCnpj: jest.fn(),
    findById: jest.fn(),
    findByContratoProvedorId: jest.fn(),
    obterDetalhe: jest.fn(),
    create: jest.fn(),
    atualizarStatus: jest.fn().mockResolvedValue({ id: "ag-1" }),
    criarContrato: jest.fn(),
    atualizarStatusContrato: jest.fn(),
    listar: jest.fn(),
    obterKpis: jest.fn(),
    obterAnaliseContratos: jest.fn(),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function fakeContratoAssinaturaService(
  overrides: Partial<ContratoAssinaturaService> = {},
): ContratoAssinaturaService {
  return {
    gerarEEnviar: jest.fn(),
    visualizarDocumento: jest.fn(),
    obterDocumento: jest.fn(),
    obterDestinatarios: jest.fn(),
    registrarWebhook: jest.fn(),
    cancelarDocumento: jest.fn(),
    ...overrides,
  };
}

function fakeHistoricoEdicaoCadastroRepository(): HistoricoEdicaoCadastroRepository {
  return {
    create: jest.fn(),
    findByEntidadeId: jest.fn(),
  };
}

describe("CancelarContratoUseCase", () => {
  it("lança NotFoundError se a agência não existe", async () => {
    const useCase = new CancelarContratoUseCase(
      fakeAgenciaRepository({ obterDetalhe: jest.fn().mockResolvedValue(null) }),
      fakeContratoAssinaturaService(),
      fakeHistoricoEdicaoCadastroRepository(),
    );

    await expect(
      useCase.execute({ agenciaId: "ag-1", justificativa: "motivo", canceladoPor: "a@b.com" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lança ConflictError se o status atual não tem contrato cancelável", async () => {
    const useCase = new CancelarContratoUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest
          .fn()
          .mockResolvedValue({ agencia: { status: STATUS_ATIVO }, contratos: [] }),
      }),
      fakeContratoAssinaturaService(),
      fakeHistoricoEdicaoCadastroRepository(),
    );

    await expect(
      useCase.execute({ agenciaId: "ag-1", justificativa: "motivo", canceladoPor: "a@b.com" }),
    ).rejects.toThrow(ConflictError);
  });

  it("lança DomainError se a justificativa estiver vazia", async () => {
    const useCase = new CancelarContratoUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue({
          agencia: { status: STATUS_AGUARDANDO_VALIDACAO },
          contratos: [{ id: "contrato-1", provedorId: "uuid-d4sign" }],
        }),
      }),
      fakeContratoAssinaturaService(),
      fakeHistoricoEdicaoCadastroRepository(),
    );

    await expect(
      useCase.execute({ agenciaId: "ag-1", justificativa: "   ", canceladoPor: "a@b.com" }),
    ).rejects.toThrow(DomainError);
  });

  it("lança ConflictError se não houver contrato pra essa agência", async () => {
    const useCase = new CancelarContratoUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest
          .fn()
          .mockResolvedValue({ agencia: { status: STATUS_AGUARDANDO_ASSINATURA }, contratos: [] }),
      }),
      fakeContratoAssinaturaService(),
      fakeHistoricoEdicaoCadastroRepository(),
    );

    await expect(
      useCase.execute({ agenciaId: "ag-1", justificativa: "motivo", canceladoPor: "a@b.com" }),
    ).rejects.toThrow(ConflictError);
  });

  it("cancela no D4Sign, marca o contrato como cancelado, devolve pra complementar e grava o histórico", async () => {
    const agenciaRepository = fakeAgenciaRepository({
      obterDetalhe: jest.fn().mockResolvedValue({
        agencia: { status: STATUS_AGUARDANDO_VALIDACAO },
        contratos: [{ id: "contrato-1", provedorId: "uuid-d4sign" }],
      }),
    });
    const contratoAssinaturaService = fakeContratoAssinaturaService();
    const historicoEdicaoCadastroRepository = fakeHistoricoEdicaoCadastroRepository();
    const useCase = new CancelarContratoUseCase(
      agenciaRepository,
      contratoAssinaturaService,
      historicoEdicaoCadastroRepository,
    );

    await useCase.execute({
      agenciaId: "ag-1",
      justificativa: "  sócio pediu pra recomeçar o cadastro  ",
      canceladoPor: "analista@sakuratur.com.br",
    });

    expect(contratoAssinaturaService.cancelarDocumento).toHaveBeenCalledWith(
      "uuid-d4sign",
      "sócio pediu pra recomeçar o cadastro",
    );
    expect(agenciaRepository.atualizarStatusContrato).toHaveBeenCalledWith(
      "contrato-1",
      CONTRATO_STATUS_CANCELADO,
    );
    expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith("ag-1", STATUS_EM_COMPLEMENTAR);
    expect(historicoEdicaoCadastroRepository.create).toHaveBeenCalledWith({
      agenciaId: "ag-1",
      entidade: "Agencia",
      entidadeId: "ag-1",
      alteracoes: { status: { de: STATUS_AGUARDANDO_VALIDACAO, para: STATUS_EM_COMPLEMENTAR } },
      justificativa: "sócio pediu pra recomeçar o cadastro",
      editadoPor: "analista@sakuratur.com.br",
    });
  });

  it("pula o cancelamento no D4Sign quando o contrato é um placeholder (nunca chegou lá)", async () => {
    const agenciaRepository = fakeAgenciaRepository({
      obterDetalhe: jest.fn().mockResolvedValue({
        agencia: { status: STATUS_AGUARDANDO_ASSINATURA },
        contratos: [{ id: "contrato-1", provedorId: CONTRATO_PROVEDOR_ID_PENDENTE }],
      }),
    });
    const contratoAssinaturaService = fakeContratoAssinaturaService();
    const useCase = new CancelarContratoUseCase(
      agenciaRepository,
      contratoAssinaturaService,
      fakeHistoricoEdicaoCadastroRepository(),
    );

    await useCase.execute({
      agenciaId: "ag-1",
      justificativa: "contrato gerado por engano",
      canceladoPor: "analista@sakuratur.com.br",
    });

    expect(contratoAssinaturaService.cancelarDocumento).not.toHaveBeenCalled();
    expect(agenciaRepository.atualizarStatusContrato).toHaveBeenCalledWith(
      "contrato-1",
      CONTRATO_STATUS_CANCELADO,
    );
  });
});
