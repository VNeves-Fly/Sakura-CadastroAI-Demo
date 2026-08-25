import { ReenviarLinkBiometriaUseCase } from "@/modules/cadastro/application/use-cases/reenviar-link-biometria.use-case";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { IniciarVerificacaoBiometricaUseCase } from "@/modules/cadastro/application/use-cases/iniciar-verificacao-biometrica.use-case";

function fakeAgenciaRepository(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findByCnpj: jest.fn(),
    findById: jest.fn(),
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

function fakeIniciarVerificacaoBiometricaUseCase(
  overrides: Partial<IniciarVerificacaoBiometricaUseCase> = {},
): IniciarVerificacaoBiometricaUseCase {
  return {
    execute: jest
      .fn()
      .mockResolvedValue({ link: "https://painel.sakuraclick.com.br/cadastro/biometria/tok" }),
    ...overrides,
  } as unknown as IniciarVerificacaoBiometricaUseCase;
}

const socio = {
  id: "socio-1",
  nome: "Fulano de Tal",
  cpf: "12345678909",
  email: "fulano@example.com",
  administrativo: null as boolean | null,
};

describe("ReenviarLinkBiometriaUseCase", () => {
  it("retorna ok:false se a agência não tem contrato", async () => {
    const useCase = new ReenviarLinkBiometriaUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue({ contratos: [], representantesLegais: [socio] }),
      }),
      fakeIniciarVerificacaoBiometricaUseCase(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      email: "fulano@example.com",
      baseUrl: "https://painel.sakuraclick.com.br",
    });

    expect(resultado).toEqual({
      ok: false,
      motivo: "Nenhum contrato encontrado pra esta agência.",
    });
  });

  it("retorna ok:false se o e-mail não bate com nenhum sócio administrativo", async () => {
    const useCase = new ReenviarLinkBiometriaUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue({
          contratos: [{ id: "contrato-1" }],
          representantesLegais: [{ ...socio, administrativo: false }],
        }),
      }),
      fakeIniciarVerificacaoBiometricaUseCase(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      email: "fulano@example.com",
      baseUrl: "https://painel.sakuraclick.com.br",
    });

    expect(resultado).toEqual({ ok: false, motivo: "Sócio não encontrado pra esse e-mail." });
  });

  it("resolve o sócio por e-mail (case-insensitive), chama IniciarVerificacaoBiometricaUseCase com disparo manual e devolve o link", async () => {
    const iniciarVerificacaoBiometricaUseCase = fakeIniciarVerificacaoBiometricaUseCase();
    const useCase = new ReenviarLinkBiometriaUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue({
          contratos: [{ id: "contrato-1" }],
          representantesLegais: [socio],
        }),
      }),
      iniciarVerificacaoBiometricaUseCase,
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      email: "Fulano@Example.com",
      baseUrl: "https://painel.sakuraclick.com.br",
    });

    expect(resultado).toEqual({
      ok: true,
      link: "https://painel.sakuraclick.com.br/cadastro/biometria/tok",
    });
    expect(iniciarVerificacaoBiometricaUseCase.execute).toHaveBeenCalledWith({
      contratoId: "contrato-1",
      agenciaId: "ag-1",
      email: "fulano@example.com",
      cpf: "12345678909",
      nome: "Fulano de Tal",
      baseUrl: "https://painel.sakuraclick.com.br",
      disparo: "manual",
    });
  });

  it("retorna ok:false com o motivo quando IniciarVerificacaoBiometricaUseCase lança (ex.: Legitimuz 401)", async () => {
    const useCase = new ReenviarLinkBiometriaUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue({
          contratos: [{ id: "contrato-1" }],
          representantesLegais: [socio],
        }),
      }),
      fakeIniciarVerificacaoBiometricaUseCase({
        execute: jest.fn().mockRejectedValue(new Error("Legitimuz get-sdk-url respondeu 401")),
      }),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      email: "fulano@example.com",
      baseUrl: "https://painel.sakuraclick.com.br",
    });

    expect(resultado.ok).toBe(false);
    expect((resultado as { motivo: string }).motivo).toContain(
      "Legitimuz get-sdk-url respondeu 401",
    );
  });
});
