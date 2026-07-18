import { ProcessarWebhookD4SignUseCase } from "@/modules/cadastro/application/use-cases/processar-webhook-d4sign.use-case";
import {
  CONTRATO_STATUS_ASSINADO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

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

describe("ProcessarWebhookD4SignUseCase", () => {
  it('ignora eventos que não são "documento finalizado" (typePost != "1")', async () => {
    const repo = criarRepositorioFake();
    const useCase = new ProcessarWebhookD4SignUseCase(repo);

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
    const useCase = new ProcessarWebhookD4SignUseCase(repo);

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
    const useCase = new ProcessarWebhookD4SignUseCase(repo);

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
    const useCase = new ProcessarWebhookD4SignUseCase(repo);

    const resultado = await useCase.execute({ provedorId: "doc-1", typePost: "1" });

    expect(repo.atualizarStatusContrato).toHaveBeenCalledWith("ct-1", CONTRATO_STATUS_ASSINADO);
    expect(repo.atualizarStatus).toHaveBeenCalledWith("ag-1", STATUS_AGUARDANDO_VALIDACAO);
    expect(resultado).toEqual({ processado: true });
  });
});
