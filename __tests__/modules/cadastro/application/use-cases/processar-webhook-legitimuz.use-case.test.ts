import { ProcessarWebhookLegitimuzUseCase } from "@/modules/cadastro/application/use-cases/processar-webhook-legitimuz.use-case";
import { BiometriaVerificacao } from "@/modules/cadastro/domain/entities/biometria-verificacao.entity";
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";

function verificacaoFake(
  overrides: Partial<Parameters<typeof BiometriaVerificacao.create>[0]> = {},
) {
  return BiometriaVerificacao.create({
    id: "biometria-1",
    contratoId: "ct-1",
    agenciaId: "ag-1",
    email: "fulano@teste.com",
    cpf: "39053344705",
    token: "token-1",
    status: "pendente",
    sessionId: "session-1",
    personId: "person-1",
    legitimuzUrl: "https://widget.legitimuz.com/token-1",
    legitimuzUrlQrCode: "https://widget.legitimuz.com/token-1/qr-code",
    tentativasLembrete: 0,
    linkEnviadoEm: new Date("2026-08-21"),
    resolvidoEm: null,
    expiraEm: new Date("2026-08-28"),
    createdAt: new Date("2026-08-21"),
    updatedAt: new Date("2026-08-21"),
    ...overrides,
  });
}

function repositorioFake(
  overrides: Partial<BiometriaVerificacaoRepository> = {},
): BiometriaVerificacaoRepository {
  return {
    criarOuSubstituir: jest.fn(),
    buscarPorToken: jest.fn().mockResolvedValue(verificacaoFake()),
    buscarPorContratoIdEEmail: jest.fn(),
    findByContratoId: jest.fn(),
    atualizarStatus: jest.fn(),
    incrementarTentativasLembrete: jest.fn(),
    ...overrides,
  };
}

describe("ProcessarWebhookLegitimuzUseCase", () => {
  it("marca aprovado quando o status cru contém 'Aprovado' (flow kyc-faceindex: 'Liveness Aprovado')", async () => {
    const repo = repositorioFake();
    const useCase = new ProcessarWebhookLegitimuzUseCase(repo);

    const resultado = await useCase.execute({ refId: "token-1", status: "Liveness Aprovado" });

    expect(repo.atualizarStatus).toHaveBeenCalledWith("biometria-1", "aprovado", expect.any(Date));
    expect(resultado).toEqual({ processado: true });
  });

  it("marca reprovado quando o status cru contém 'Reprovado'", async () => {
    const repo = repositorioFake();
    const useCase = new ProcessarWebhookLegitimuzUseCase(repo);

    await useCase.execute({ refId: "token-1", status: "Liveness Reprovado" });

    expect(repo.atualizarStatus).toHaveBeenCalledWith("biometria-1", "reprovado", expect.any(Date));
  });

  it("marca análise manual sem sobrescrever resolvidoEm", async () => {
    const repo = repositorioFake();
    const useCase = new ProcessarWebhookLegitimuzUseCase(repo);

    await useCase.execute({ refId: "token-1", status: "Análise Manual" });

    expect(repo.atualizarStatus).toHaveBeenCalledWith(
      "biometria-1",
      "analise_manual",
      expect.any(Date),
    );
  });

  it("não processa (e não chama o repositório) status não reconhecido", async () => {
    const repo = repositorioFake();
    const useCase = new ProcessarWebhookLegitimuzUseCase(repo);

    const resultado = await useCase.execute({ refId: "token-1", status: "Xablau" });

    expect(resultado.processado).toBe(false);
    expect(repo.buscarPorToken).not.toHaveBeenCalled();
    expect(repo.atualizarStatus).not.toHaveBeenCalled();
  });

  it("não processa quando o ref_id não corresponde a nenhuma verificação conhecida", async () => {
    const repo = repositorioFake({ buscarPorToken: jest.fn().mockResolvedValue(null) });
    const useCase = new ProcessarWebhookLegitimuzUseCase(repo);

    const resultado = await useCase.execute({ refId: "token-inexistente", status: "Aprovado" });

    expect(resultado.processado).toBe(false);
    expect(repo.atualizarStatus).not.toHaveBeenCalled();
  });
});
