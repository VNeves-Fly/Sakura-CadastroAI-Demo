import { ProcessarWebhookLegitimuzUseCase } from "@/modules/cadastro/application/use-cases/processar-webhook-legitimuz.use-case";
import { BiometriaVerificacao } from "@/modules/cadastro/domain/entities/biometria-verificacao.entity";
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ContratoSignatarioRepository } from "@/modules/cadastro/domain/repositories/contrato-signatario-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";

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
    findByContratoId: jest.fn().mockResolvedValue([]),
    atualizarStatus: jest.fn(),
    incrementarTentativasLembrete: jest.fn(),
    ...overrides,
  };
}

// Sem overrides, obterDetalhe resolve undefined — gateBiometriaAtivo vira
// falsy e o use-case nem tenta avançar Agencia.status (mesmo
// comportamento de sempre pros testes que só cobrem a atualização do
// status da biometria em si).
function fakeAgenciaRepository(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    obterDetalhe: jest.fn(),
    atualizarStatus: jest.fn(),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function fakeContratoSignatarioRepository(
  socios: Array<{ email: string }> = [],
): ContratoSignatarioRepository {
  return {
    findByContratoId: jest.fn().mockResolvedValue(socios),
  } as unknown as ContratoSignatarioRepository;
}

function fakeContratoAssinaturaRepository(
  assinaturas: Array<{ email: string; assinadoEm: Date | null }> = [],
): ContratoAssinaturaRepository {
  return {
    findByContratoId: jest.fn().mockResolvedValue(assinaturas),
  } as unknown as ContratoAssinaturaRepository;
}

describe("ProcessarWebhookLegitimuzUseCase", () => {
  it("marca aprovado quando o status cru contém 'Aprovado' (flow kyc-faceindex: 'Liveness Aprovado')", async () => {
    const repo = repositorioFake();
    const useCase = new ProcessarWebhookLegitimuzUseCase(
      repo,
      fakeAgenciaRepository(),
      fakeContratoSignatarioRepository(),
      fakeContratoAssinaturaRepository(),
    );

    const resultado = await useCase.execute({ refId: "token-1", status: "Liveness Aprovado" });

    expect(repo.atualizarStatus).toHaveBeenCalledWith("biometria-1", "aprovado", expect.any(Date));
    expect(resultado).toEqual({ processado: true });
  });

  it("marca reprovado quando o status cru contém 'Reprovado'", async () => {
    const repo = repositorioFake();
    const useCase = new ProcessarWebhookLegitimuzUseCase(
      repo,
      fakeAgenciaRepository(),
      fakeContratoSignatarioRepository(),
      fakeContratoAssinaturaRepository(),
    );

    await useCase.execute({ refId: "token-1", status: "Liveness Reprovado" });

    expect(repo.atualizarStatus).toHaveBeenCalledWith("biometria-1", "reprovado", expect.any(Date));
  });

  it("marca análise manual sem sobrescrever resolvidoEm", async () => {
    const repo = repositorioFake();
    const useCase = new ProcessarWebhookLegitimuzUseCase(
      repo,
      fakeAgenciaRepository(),
      fakeContratoSignatarioRepository(),
      fakeContratoAssinaturaRepository(),
    );

    await useCase.execute({ refId: "token-1", status: "Análise Manual" });

    expect(repo.atualizarStatus).toHaveBeenCalledWith(
      "biometria-1",
      "analise_manual",
      expect.any(Date),
    );
  });

  it("não processa (e não chama o repositório) status não reconhecido", async () => {
    const repo = repositorioFake();
    const useCase = new ProcessarWebhookLegitimuzUseCase(
      repo,
      fakeAgenciaRepository(),
      fakeContratoSignatarioRepository(),
      fakeContratoAssinaturaRepository(),
    );

    const resultado = await useCase.execute({ refId: "token-1", status: "Xablau" });

    expect(resultado.processado).toBe(false);
    expect(repo.buscarPorToken).not.toHaveBeenCalled();
    expect(repo.atualizarStatus).not.toHaveBeenCalled();
  });

  it("não processa quando o ref_id não corresponde a nenhuma verificação conhecida", async () => {
    const repo = repositorioFake({ buscarPorToken: jest.fn().mockResolvedValue(null) });
    const useCase = new ProcessarWebhookLegitimuzUseCase(
      repo,
      fakeAgenciaRepository(),
      fakeContratoSignatarioRepository(),
      fakeContratoAssinaturaRepository(),
    );

    const resultado = await useCase.execute({ refId: "token-inexistente", status: "Aprovado" });

    expect(resultado.processado).toBe(false);
    expect(repo.atualizarStatus).not.toHaveBeenCalled();
  });

  describe("avanço de Agencia.status com gate ativo (2026-08-25)", () => {
    const detalheGateAtivo = {
      agencia: { status: "aguardando_assinatura", gateBiometriaAtivo: true },
    };

    it("avança pra aguardando_cadastramento quando esta aprovação é a última peça faltando (todos já assinados)", async () => {
      // findByContratoId precisa refletir o "aprovado" que acabou de ser
      // gravado (o fake não tem estado persistente de verdade — atualizarStatus
      // é só um jest.fn() — então simula aqui o que o repositório real
      // devolveria numa releitura logo em seguida).
      const repo = repositorioFake({
        findByContratoId: jest
          .fn()
          .mockResolvedValue([
            { id: "biometria-1", email: "fulano@teste.com", status: "aprovado" },
          ]),
      });
      const agenciaRepository = fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue(detalheGateAtivo),
      });
      const useCase = new ProcessarWebhookLegitimuzUseCase(
        repo,
        agenciaRepository,
        fakeContratoSignatarioRepository([{ email: "fulano@teste.com" }]),
        fakeContratoAssinaturaRepository([
          { email: "fulano@teste.com", assinadoEm: new Date("2026-08-25") },
        ]),
      );

      await useCase.execute({ refId: "token-1", status: "Liveness Aprovado" });

      expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith(
        "ag-1",
        "aguardando_cadastramento",
        { usuarioEmail: null, origem: "sistema - legitimuz" },
      );
    });

    it("NÃO avança se ainda faltar outro sócio assinar, mesmo com esta biometria aprovada", async () => {
      const repo = repositorioFake();
      const agenciaRepository = fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue(detalheGateAtivo),
      });
      const useCase = new ProcessarWebhookLegitimuzUseCase(
        repo,
        agenciaRepository,
        fakeContratoSignatarioRepository([
          { email: "fulano@teste.com" },
          { email: "outro-socio@teste.com" },
        ]),
        fakeContratoAssinaturaRepository([
          { email: "fulano@teste.com", assinadoEm: new Date("2026-08-25") },
        ]),
      );

      await useCase.execute({ refId: "token-1", status: "Liveness Aprovado" });

      expect(agenciaRepository.atualizarStatus).not.toHaveBeenCalled();
    });

    it("NÃO avança se a agência não tiver o gate ativo (comportamento de sempre — quem avança é o webhook do D4Sign)", async () => {
      const repo = repositorioFake();
      const agenciaRepository = fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue({
          agencia: { status: "aguardando_assinatura", gateBiometriaAtivo: false },
        }),
      });
      const useCase = new ProcessarWebhookLegitimuzUseCase(
        repo,
        agenciaRepository,
        fakeContratoSignatarioRepository([{ email: "fulano@teste.com" }]),
        fakeContratoAssinaturaRepository([
          { email: "fulano@teste.com", assinadoEm: new Date("2026-08-25") },
        ]),
      );

      await useCase.execute({ refId: "token-1", status: "Liveness Aprovado" });

      expect(agenciaRepository.atualizarStatus).not.toHaveBeenCalled();
    });
  });
});
