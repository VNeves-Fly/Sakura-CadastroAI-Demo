import { ConsultarSicaUseCase } from "@/modules/cadastro/application/use-cases/consultar-sica.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
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
    status: "em_complementar",
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
    consultarSicaCNPJ: jest.fn().mockResolvedValue({ encontrado: false, registro: null }),
    consultarSicaCodigoEmpresa: jest.fn().mockResolvedValue({ encontrado: false, registro: null }),
    verificarConexao: jest.fn(),
    ...overrides,
  };
}

describe("ConsultarSicaUseCase", () => {
  it("lança NotFoundError quando a agência não existe", async () => {
    const useCase = new ConsultarSicaUseCase(
      repositorioFake({ findById: jest.fn().mockResolvedValue(null) }),
      sstServiceFake(),
    );

    await expect(
      useCase.execute({ agenciaId: "agencia-1", consultadoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("consulta por CNPJ e grava sucesso com o resultado encontrado", async () => {
    const agenciaRepository = repositorioFake();
    const resultado = {
      encontrado: true,
      registro: {
        codigoEmpresa: 57295,
        nome: "017 VIAGENS",
        cnpj: "43600690000122",
        telefone: "17996364199",
        email: "financeiro@017viagens.com.br",
        empresaStatus: "ativo" as const,
        codigoExecutivo: 42,
        nomeExecutivo: "Fulano",
      },
    };
    const sstService = sstServiceFake({
      consultarSicaCNPJ: jest.fn().mockResolvedValue(resultado),
    });
    const useCase = new ConsultarSicaUseCase(agenciaRepository, sstService);

    await useCase.execute({ agenciaId: "agencia-1", consultadoPor: "analista@x.com" });

    expect(sstService.consultarSicaCNPJ).toHaveBeenCalledWith("43600690000122");
    expect(agenciaRepository.registrarConsultaSst).toHaveBeenCalledWith("agencia-1", {
      sucesso: true,
      erro: null,
      metodo: "cnpj",
      resultado,
      consultadoPor: "analista@x.com",
    });
  });

  it("nunca lança quando o SST falha — grava sucesso=false", async () => {
    const agenciaRepository = repositorioFake();
    const sstService = sstServiceFake({
      consultarSicaCNPJ: jest.fn().mockRejectedValue(new Error("timeout")),
    });
    const useCase = new ConsultarSicaUseCase(agenciaRepository, sstService);

    await expect(
      useCase.execute({ agenciaId: "agencia-1", consultadoPor: "analista@x.com" }),
    ).resolves.toBeUndefined();

    expect(agenciaRepository.registrarConsultaSst).toHaveBeenCalledWith("agencia-1", {
      sucesso: false,
      erro: "Error: timeout",
      metodo: "cnpj",
      resultado: null,
      consultadoPor: "analista@x.com",
    });
  });
});
