import { AtualizarSicaUseCase } from "@/modules/cadastro/application/use-cases/atualizar-sica.use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { SstService } from "@/modules/cadastro/domain/services/sst-service";

function agenciaFake(overrides: Partial<Parameters<typeof Agencia.create>[0]> = {}): Agencia {
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
    sicaCodigo: "57295",
    sicaSalvoPor: "analista@x.com",
    sicaSalvoEm: new Date("2026-01-02"),
    travelLinkCriado: false,
    travelLinkSalvoPor: null,
    travelLinkSalvoEm: null,
    executivoId: null,
    ...overrides,
  });
}

function repositorioFake(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findById: jest.fn().mockResolvedValue(agenciaFake()),
    registrarConsultaSst: jest.fn(),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function sstServiceFake(overrides: Partial<SstService> = {}): SstService {
  return {
    consultarSicaCNPJ: jest.fn(),
    consultarSicaCodigoEmpresa: jest.fn().mockResolvedValue({ encontrado: false, registro: null }),
    ...overrides,
  };
}

describe("AtualizarSicaUseCase", () => {
  it("lança NotFoundError quando a agência não existe", async () => {
    const useCase = new AtualizarSicaUseCase(
      repositorioFake({ findById: jest.fn().mockResolvedValue(null) }),
      sstServiceFake(),
    );

    await expect(
      useCase.execute({ agenciaId: "agencia-1", atualizadoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lança DomainError quando a agência ainda não tem código SICA salvo", async () => {
    const agenciaRepository = repositorioFake({
      findById: jest.fn().mockResolvedValue(agenciaFake({ sicaCodigo: null })),
    });
    const useCase = new AtualizarSicaUseCase(agenciaRepository, sstServiceFake());

    await expect(
      useCase.execute({ agenciaId: "agencia-1", atualizadoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(agenciaRepository.registrarConsultaSst).not.toHaveBeenCalled();
  });

  it("consulta pelo código já salvo (não pelo CNPJ) e grava sucesso", async () => {
    const agenciaRepository = repositorioFake();
    const resultado = {
      encontrado: true,
      registro: {
        codigoEmpresa: 57295,
        nome: "017 VIAGENS",
        cnpj: "43600690000122",
        telefone: "17996364199",
        email: "financeiro@017viagens.com.br",
        empresaStatus: "inativo" as const,
        codigoExecutivo: 42,
        nomeExecutivo: "Fulano",
      },
    };
    const sstService = sstServiceFake({
      consultarSicaCodigoEmpresa: jest.fn().mockResolvedValue(resultado),
    });
    const useCase = new AtualizarSicaUseCase(agenciaRepository, sstService);

    await useCase.execute({ agenciaId: "agencia-1", atualizadoPor: "analista@x.com" });

    expect(sstService.consultarSicaCodigoEmpresa).toHaveBeenCalledWith(57295);
    expect(agenciaRepository.registrarConsultaSst).toHaveBeenCalledWith("agencia-1", {
      sucesso: true,
      erro: null,
      metodo: "codigo_empresa",
      resultado,
      consultadoPor: "analista@x.com",
    });
  });

  it("nunca lança quando o SST falha tecnicamente — grava sucesso=false", async () => {
    const agenciaRepository = repositorioFake();
    const sstService = sstServiceFake({
      consultarSicaCodigoEmpresa: jest.fn().mockRejectedValue(new Error("timeout")),
    });
    const useCase = new AtualizarSicaUseCase(agenciaRepository, sstService);

    await expect(
      useCase.execute({ agenciaId: "agencia-1", atualizadoPor: "analista@x.com" }),
    ).resolves.toBeUndefined();

    expect(agenciaRepository.registrarConsultaSst).toHaveBeenCalledWith("agencia-1", {
      sucesso: false,
      erro: "Error: timeout",
      metodo: "codigo_empresa",
      resultado: null,
      consultadoPor: "analista@x.com",
    });
  });
});
