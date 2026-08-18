import { ConfirmarCadastramentoUseCase } from "@/modules/cadastro/application/use-cases/confirmar-cadastramento.use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import {
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  type AgenciaDetalhe,
  type AgenciaRepository,
  type ConsultaSstItem,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

function agenciaFake(sicaCodigo: string | null): Agencia {
  return Agencia.create({
    id: "agencia-1",
    razaoSocial: "Empresa Teste Ltda",
    nomeFantasia: null,
    cnpj: "43600690000122",
    etapaAtual: 1,
    status: STATUS_AGUARDANDO_CADASTRAMENTO,
    contratoSocialPath: "agencias/43600690000122/contrato-social.pdf",
    emailContato: "operacional@example.com",
    telefoneContato: "11988887777",
    origem: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    sicaCodigo,
    sicaSalvoPor: sicaCodigo ? "analista@x.com" : null,
    sicaSalvoEm: sicaCodigo ? new Date("2026-01-02") : null,
    travelLinkCriado: true,
    travelLinkSalvoPor: "analista@x.com",
    travelLinkSalvoEm: new Date("2026-01-02"),
    executivoId: null,
    atualizacaoVistaEm: null,
    atualizacaoVistaPor: null,
    infoPendente: false,
  });
}

function consultaSstFake(overrides: Partial<ConsultaSstItem> = {}): ConsultaSstItem {
  return {
    id: "consulta-1",
    sucesso: true,
    erro: null,
    metodo: "codigo_empresa",
    encontrado: true,
    codigoEmpresa: 57295,
    nomeEmpresa: "017 VIAGENS",
    telefone: "17996364199",
    email: "financeiro@017viagens.com.br",
    empresaStatus: "ativo",
    codigoExecutivo: 42,
    nomeExecutivo: "Fulano",
    consultadoPor: "analista@x.com",
    createdAt: new Date("2026-01-02"),
    ...overrides,
  };
}

function detalheFake(overrides: Partial<AgenciaDetalhe> = {}): AgenciaDetalhe {
  return {
    agencia: agenciaFake("57295"),
    complementar: null,
    representantesLegais: [],
    contratoSocial: null,
    contratos: [],
    analiseIa: null,
    historicoConsultaCredito: [],
    consultasSst: [consultaSstFake()],
    executivoNome: null,
    associacaoNome: null,
    eventoNome: null,
    ...overrides,
  };
}

function repositorioFake(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    obterDetalhe: jest.fn().mockResolvedValue(detalheFake()),
    atualizarStatus: jest.fn().mockResolvedValue(agenciaFake("57295")),
    ...overrides,
  } as unknown as AgenciaRepository;
}

describe("ConfirmarCadastramentoUseCase", () => {
  it("lança NotFoundError quando a agência não existe", async () => {
    const useCase = new ConfirmarCadastramentoUseCase(
      repositorioFake({ obterDetalhe: jest.fn().mockResolvedValue(null) }),
    );

    await expect(
      useCase.execute({ agenciaId: "agencia-1", confirmadoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("bloqueia quando não há código SICA salvo", async () => {
    const agenciaRepository = repositorioFake({
      obterDetalhe: jest
        .fn()
        .mockResolvedValue(detalheFake({ agencia: agenciaFake(null), consultasSst: [] })),
    });
    const useCase = new ConfirmarCadastramentoUseCase(agenciaRepository);

    await expect(
      useCase.execute({ agenciaId: "agencia-1", confirmadoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(agenciaRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it("bloqueia quando a consulta mais recente não encontrou a empresa no SICA", async () => {
    const agenciaRepository = repositorioFake({
      obterDetalhe: jest.fn().mockResolvedValue(
        detalheFake({
          consultasSst: [consultaSstFake({ encontrado: false, empresaStatus: null })],
        }),
      ),
    });
    const useCase = new ConfirmarCadastramentoUseCase(agenciaRepository);

    await expect(
      useCase.execute({ agenciaId: "agencia-1", confirmadoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(agenciaRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it("bloqueia quando a empresa está inativa no SICA", async () => {
    const agenciaRepository = repositorioFake({
      obterDetalhe: jest
        .fn()
        .mockResolvedValue(
          detalheFake({ consultasSst: [consultaSstFake({ empresaStatus: "inativo" })] }),
        ),
    });
    const useCase = new ConfirmarCadastramentoUseCase(agenciaRepository);

    await expect(
      useCase.execute({ agenciaId: "agencia-1", confirmadoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(agenciaRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it("ignora tentativas de consulta que falharam tecnicamente (sucesso=false) e olha a próxima", async () => {
    const agenciaRepository = repositorioFake({
      obterDetalhe: jest.fn().mockResolvedValue(
        detalheFake({
          consultasSst: [
            consultaSstFake({
              id: "consulta-2",
              sucesso: false,
              encontrado: false,
              empresaStatus: null,
            }),
            consultaSstFake({ id: "consulta-1", sucesso: true, empresaStatus: "ativo" }),
          ],
        }),
      ),
    });
    const useCase = new ConfirmarCadastramentoUseCase(agenciaRepository);

    await useCase.execute({ agenciaId: "agencia-1", confirmadoPor: "analista@x.com" });

    expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith(
      "agencia-1",
      STATUS_AGUARDANDO_ATIVACAO,
      { usuarioEmail: "analista@x.com", origem: "usuario" },
    );
  });

  it("avança pra aguardando_ativacao quando SICA está salvo e ativo", async () => {
    const agenciaRepository = repositorioFake();
    const useCase = new ConfirmarCadastramentoUseCase(agenciaRepository);

    await useCase.execute({ agenciaId: "agencia-1", confirmadoPor: "analista@x.com" });

    expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith(
      "agencia-1",
      STATUS_AGUARDANDO_ATIVACAO,
      { usuarioEmail: "analista@x.com", origem: "usuario" },
    );
  });
});
