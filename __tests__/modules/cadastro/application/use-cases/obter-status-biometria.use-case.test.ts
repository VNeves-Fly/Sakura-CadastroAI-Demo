import { ObterStatusBiometriaUseCase } from "@/modules/cadastro/application/use-cases/obter-status-biometria.use-case";
import { BiometriaVerificacao } from "@/modules/cadastro/domain/entities/biometria-verificacao.entity";
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";
import type { ObterLinkAssinaturaUseCase } from "@/modules/cadastro/application/use-cases/obter-link-assinatura.use-case";

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
    // Data bem distante no futuro (não usar algo "perto" da data de criação
    // do teste — o teste anterior usava 2026-08-28 e quebrou sozinho ao
    // chegar essa data real, já que `expirado` compara com Date.now()).
    expiraEm: new Date("2099-01-01"),
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

function obterLinkAssinaturaFake(execute = jest.fn()): ObterLinkAssinaturaUseCase {
  return { execute } as unknown as ObterLinkAssinaturaUseCase;
}

describe("ObterStatusBiometriaUseCase", () => {
  // 2026-08-26: devolve ok:false em vez de lançar (CPF errado, link
  // expirado) — um erro lançado atravessa a Server Action que chama isto
  // e o Next.js redacta a mensagem em produção (bug real relatado pelo
  // usuário: só aparecia o digest genérico, nunca "CPF não confere").
  it("devolve ok:false quando o token não existe", async () => {
    const repo = repositorioFake({ buscarPorToken: jest.fn().mockResolvedValue(null) });
    const useCase = new ObterStatusBiometriaUseCase(repo, obterLinkAssinaturaFake());

    const resultado = await useCase.execute({ token: "inexistente", cpf: "39053344705" });

    expect(resultado.ok).toBe(false);
  });

  it("devolve ok:false quando o token existe mas expirou", async () => {
    const repo = repositorioFake({
      buscarPorToken: jest
        .fn()
        .mockResolvedValue(verificacaoFake({ expiraEm: new Date("2020-01-01") })),
    });
    const useCase = new ObterStatusBiometriaUseCase(repo, obterLinkAssinaturaFake());

    const resultado = await useCase.execute({ token: "token-1", cpf: "39053344705" });

    expect(resultado.ok).toBe(false);
  });

  it("devolve ok:false sem vazar qual dado está errado quando o CPF não confere", async () => {
    const repo = repositorioFake();
    const useCase = new ObterStatusBiometriaUseCase(repo, obterLinkAssinaturaFake());

    const resultado = await useCase.execute({ token: "token-1", cpf: "00000000000" });

    expect(resultado).toEqual({ ok: false, motivo: expect.any(String) });
  });

  it("aceita o CPF com ou sem máscara (compara só dígitos)", async () => {
    const repo = repositorioFake();
    const useCase = new ObterStatusBiometriaUseCase(repo, obterLinkAssinaturaFake());

    const resultado = await useCase.execute({ token: "token-1", cpf: "390.533.447-05" });

    expect(resultado.ok && resultado.status).toBe("pendente");
  });

  it("devolve o legitimuzUrl quando ainda pendente, sem chamar ObterLinkAssinaturaUseCase", async () => {
    const repo = repositorioFake();
    const obterLink = obterLinkAssinaturaFake();
    const useCase = new ObterStatusBiometriaUseCase(repo, obterLink);

    const resultado = await useCase.execute({ token: "token-1", cpf: "39053344705" });

    expect(resultado).toEqual({
      ok: true,
      status: "pendente",
      legitimuzUrl: "https://widget.legitimuz.com/token-1",
      linkAssinatura: null,
    });
    expect(obterLink.execute).not.toHaveBeenCalled();
  });

  it("busca o link de assinatura fresco quando aprovado", async () => {
    const repo = repositorioFake({
      buscarPorToken: jest.fn().mockResolvedValue(verificacaoFake({ status: "aprovado" })),
    });
    const obterLink = obterLinkAssinaturaFake(
      jest.fn().mockResolvedValue({ ok: true, link: "https://secure.d4sign.com.br/w/i/xyz" }),
    );
    const useCase = new ObterStatusBiometriaUseCase(repo, obterLink);

    const resultado = await useCase.execute({ token: "token-1", cpf: "39053344705" });

    expect(obterLink.execute).toHaveBeenCalledWith({
      agenciaId: "ag-1",
      email: "fulano@teste.com",
    });
    expect(resultado).toEqual({
      ok: true,
      status: "aprovado",
      legitimuzUrl: null,
      linkAssinatura: "https://secure.d4sign.com.br/w/i/xyz",
    });
  });

  it("devolve linkAssinatura null (sem lançar) quando aprovado mas o D4Sign ainda não tem o keySigner", async () => {
    const repo = repositorioFake({
      buscarPorToken: jest.fn().mockResolvedValue(verificacaoFake({ status: "aprovado" })),
    });
    const obterLink = obterLinkAssinaturaFake(
      jest.fn().mockResolvedValue({ ok: false, motivo: "sem keySigner" }),
    );
    const useCase = new ObterStatusBiometriaUseCase(repo, obterLink);

    const resultado = await useCase.execute({ token: "token-1", cpf: "39053344705" });

    expect(resultado).toEqual({
      ok: true,
      status: "aprovado",
      legitimuzUrl: null,
      linkAssinatura: null,
    });
  });
});
