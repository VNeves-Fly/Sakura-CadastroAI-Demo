import { SalvarSicaUseCase } from "@/modules/cadastro/application/use-cases/salvar-sica.use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { SstService } from "@/modules/cadastro/domain/services/sst-service";

function agenciaFake(): Agencia {
  return Agencia.create({
    id: "agencia-1",
    razaoSocial: "Empresa Teste Ltda",
    nomeFantasia: null,
    cnpj: "43600690000122",
    etapaAtual: 1,
    status: "aguardando_cadastramento",
    contratoSocialPath: "agencias/43600690000122/contrato-social.pdf",
    emailContato: "operacional@example.com",
    telefoneContato: "11988887777",
    origem: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    sicaCodigo: null,
    sicaSalvoPor: null,
    sicaSalvoEm: null,
    travelLinkCriado: false,
    travelLinkSalvoPor: null,
    travelLinkSalvoEm: null,
    executivoId: null,
    atualizacaoVistaEm: null,
    atualizacaoVistaPor: null,
    infoPendente: false,
  });
}

const REGISTRO_CNPJ_BATENDO = {
  codigoEmpresa: 57295,
  nome: "017 VIAGENS",
  cnpj: "43600690000122",
  telefone: "17996364199",
  email: "financeiro@017viagens.com.br",
  empresaStatus: "ativo" as const,
  codigoExecutivo: 42,
  nomeExecutivo: "Fulano",
};

function repositorioFake(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findById: jest.fn().mockResolvedValue(agenciaFake()),
    registrarConsultaSst: jest.fn(),
    salvarSica: jest.fn().mockResolvedValue(agenciaFake()),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function sstServiceFake(overrides: Partial<SstService> = {}): SstService {
  return {
    consultarSicaCNPJ: jest.fn(),
    consultarSicaCodigoEmpresa: jest
      .fn()
      .mockResolvedValue({ encontrado: true, registro: REGISTRO_CNPJ_BATENDO }),
    ...overrides,
  };
}

describe("SalvarSicaUseCase", () => {
  it("lança NotFoundError quando a agência não existe", async () => {
    const useCase = new SalvarSicaUseCase(
      repositorioFake({ findById: jest.fn().mockResolvedValue(null) }),
      sstServiceFake(),
    );

    await expect(
      useCase.execute({ agenciaId: "agencia-1", codigo: "57295", salvoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("salva quando o CNPJ retornado bate com o da agência", async () => {
    const agenciaRepository = repositorioFake();
    const useCase = new SalvarSicaUseCase(agenciaRepository, sstServiceFake());

    await useCase.execute({ agenciaId: "agencia-1", codigo: "57295", salvoPor: "analista@x.com" });

    expect(agenciaRepository.registrarConsultaSst).toHaveBeenCalledWith("agencia-1", {
      sucesso: true,
      erro: null,
      metodo: "codigo_empresa",
      resultado: { encontrado: true, registro: REGISTRO_CNPJ_BATENDO },
      consultadoPor: "analista@x.com",
    });
    expect(agenciaRepository.salvarSica).toHaveBeenCalledWith("agencia-1", {
      codigo: "57295",
      salvoPor: "analista@x.com",
    });
  });

  it("bloqueia quando o CNPJ retornado diverge do da agência (código de outra empresa)", async () => {
    const agenciaRepository = repositorioFake();
    const sstService = sstServiceFake({
      consultarSicaCodigoEmpresa: jest.fn().mockResolvedValue({
        encontrado: true,
        registro: { ...REGISTRO_CNPJ_BATENDO, cnpj: "00000000000000" },
      }),
    });
    const useCase = new SalvarSicaUseCase(agenciaRepository, sstService);

    await expect(
      useCase.execute({ agenciaId: "agencia-1", codigo: "57295", salvoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(agenciaRepository.salvarSica).not.toHaveBeenCalled();
    // A tentativa ainda é auditada, mesmo bloqueada.
    expect(agenciaRepository.registrarConsultaSst).toHaveBeenCalled();
  });

  it("bloqueia quando o código não é encontrado no SST", async () => {
    const agenciaRepository = repositorioFake();
    const sstService = sstServiceFake({
      consultarSicaCodigoEmpresa: jest
        .fn()
        .mockResolvedValue({ encontrado: false, registro: null }),
    });
    const useCase = new SalvarSicaUseCase(agenciaRepository, sstService);

    await expect(
      useCase.execute({ agenciaId: "agencia-1", codigo: "99999", salvoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(agenciaRepository.salvarSica).not.toHaveBeenCalled();
  });

  it("bloqueia e audita quando a chamada ao SST falha tecnicamente", async () => {
    const agenciaRepository = repositorioFake();
    const sstService = sstServiceFake({
      consultarSicaCodigoEmpresa: jest.fn().mockRejectedValue(new Error("timeout")),
    });
    const useCase = new SalvarSicaUseCase(agenciaRepository, sstService);

    await expect(
      useCase.execute({ agenciaId: "agencia-1", codigo: "57295", salvoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(DomainError);

    expect(agenciaRepository.registrarConsultaSst).toHaveBeenCalledWith("agencia-1", {
      sucesso: false,
      erro: "Error: timeout",
      metodo: "codigo_empresa",
      resultado: null,
      consultadoPor: "analista@x.com",
    });
    expect(agenciaRepository.salvarSica).not.toHaveBeenCalled();
  });
});
