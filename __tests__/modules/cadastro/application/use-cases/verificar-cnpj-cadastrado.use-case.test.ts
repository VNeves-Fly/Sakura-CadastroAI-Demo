import { VerificarCnpjCadastradoUseCase } from "@/modules/cadastro/application/use-cases/verificar-cnpj-cadastrado.use-case";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

function criarRepositorioFake(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findByCnpj: jest.fn().mockResolvedValue(null),
    findById: jest.fn(),
    findByContratoProvedorId: jest.fn(),
    obterDetalhe: jest.fn(),
    create: jest.fn(),
    registrarAnaliseDocumento: jest.fn(),
    registrarAnaliseFinal: jest.fn(),
    atualizarStatus: jest.fn(),
    salvarSica: jest.fn(),
    salvarTravelLink: jest.fn(),
    criarContrato: jest.fn(),
    atualizarStatusContrato: jest.fn(),
    listar: jest.fn(),
    obterKpis: jest.fn(),
    obterAnaliseContratos: jest.fn(),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function agenciaFake(cnpj: string): Agencia {
  return Agencia.create({
    id: "agencia-1",
    razaoSocial: "Empresa Teste Ltda",
    nomeFantasia: null,
    cnpj,
    etapaAtual: 1,
    status: "em_analise",
    contratoSocialPath: "x",
    emailContato: "x@x.com",
    telefoneContato: "11999999999",
    origem: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    infoPendenteRemovidoPor: null,
    infoPendenteRemovidoEm: null,
    gateBiometriaAtivo: false,
  });
}

describe("VerificarCnpjCadastradoUseCase", () => {
  it("devolve existe=false quando não há agência com esse CNPJ", async () => {
    const agenciaRepository = criarRepositorioFake({
      findByCnpj: jest.fn().mockResolvedValue(null),
    });
    const useCase = new VerificarCnpjCadastradoUseCase(agenciaRepository);

    const resultado = await useCase.execute({ cnpj: "12345678000195" });

    expect(resultado).toEqual({ existe: false });
  });

  it("devolve existe=true quando já existe uma agência com esse CNPJ", async () => {
    const agenciaRepository = criarRepositorioFake({
      findByCnpj: jest.fn().mockResolvedValue(agenciaFake("12345678000195")),
    });
    const useCase = new VerificarCnpjCadastradoUseCase(agenciaRepository);

    const resultado = await useCase.execute({ cnpj: "12345678000195" });

    expect(resultado).toEqual({ existe: true });
  });

  it("não expõe nenhum dado da agência encontrada além do booleano (sem vazar status/razão social)", async () => {
    const agenciaRepository = criarRepositorioFake({
      findByCnpj: jest.fn().mockResolvedValue(agenciaFake("12345678000195")),
    });
    const useCase = new VerificarCnpjCadastradoUseCase(agenciaRepository);

    const resultado = await useCase.execute({ cnpj: "12345678000195" });

    expect(Object.keys(resultado)).toEqual(["existe"]);
  });

  it("repassa o CNPJ exatamente como recebido pro repositório, sem normalizar", async () => {
    const agenciaRepository = criarRepositorioFake();
    const useCase = new VerificarCnpjCadastradoUseCase(agenciaRepository);

    await useCase.execute({ cnpj: "12.345.678/0001-95" });

    expect(agenciaRepository.findByCnpj).toHaveBeenCalledWith("12.345.678/0001-95");
  });
});
