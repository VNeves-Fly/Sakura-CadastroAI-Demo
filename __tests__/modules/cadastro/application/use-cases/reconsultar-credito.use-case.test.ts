import { ReconsultarCreditoUseCase } from "@/modules/cadastro/application/use-cases/reconsultar-credito.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import {
  STATUS_ATIVO,
  type AgenciaDetalhe,
  type AgenciaRepository,
  type RepresentanteLegalDetalhe,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type {
  AnaliseIaResultado,
  AnaliseIaService,
  AnaliseIaStage2,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import type { SofiaConsultaService } from "@/modules/cadastro/domain/services/sofia-consulta-service";

const ENDERECO = {
  cep: "01310-100",
  logradouro: "Av Paulista",
  numero: "1000",
  complemento: "",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

function agenciaFake(): Agencia {
  return Agencia.create({
    id: "agencia-1",
    razaoSocial: "Empresa Teste Ltda",
    cnpj: "12345678000195",
    etapaAtual: 1,
    status: STATUS_ATIVO,
    contratoSocialPath: "agencias/12345678000195/contrato-social.pdf",
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
  });
}

function documentoFake(id: string, gcsPath: string): Documento {
  return Documento.create({
    id,
    agenciaId: "agencia-1",
    representanteLegalId: null,
    tipo: "RG_CNPJ",
    fileName: null,
    descricaoOutro: null,
    mimeType: null,
    gcsPath,
    gcsBucket: "bucket",
    gcsSize: null,
    gcsMd5: null,
    status: "PENDENTE",
    verificado: false,
    reprovadoPor: null,
    motivoReprovacao: null,
    reprovadoEm: null,
    aprovadoPor: null,
    motivoAprovacao: null,
    aprovadoEm: null,
    inseridoManualmentePor: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function socioFake(): RepresentanteLegalDetalhe {
  return {
    id: "socio-1",
    nome: "Fulano de Tal",
    cpf: "12345678909",
    email: "fulano@example.com",
    telefone: "11999998888",
    estadoCivil: "solteiro",
    isRepresentanteLegal: true,
    endereco: ENDERECO,
    rg: documentoFake("doc-rg-1", "agencias/12345678000195/socio-0-rg.pdf"),
    procuracao: null,
    rgNumero: null,
    rgOrgaoEmissor: null,
    nacionalidade: null,
    dataNascimento: new Date("1990-01-01"),
    administrativo: null,
  };
}

function detalheFake(overrides: Partial<AgenciaDetalhe> = {}): AgenciaDetalhe {
  return {
    agencia: agenciaFake(),
    complementar: null,
    representantesLegais: [socioFake()],
    contratoSocial: null,
    contratos: [],
    analiseIa: null,
    historicoConsultaCredito: [],
    executivoNome: null,
    associacaoNome: null,
    eventoNome: null,
    ...overrides,
  };
}

function repositorioFake(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findByCnpj: jest.fn(),
    findById: jest.fn(),
    findByContratoProvedorId: jest.fn(),
    obterDetalhe: jest.fn().mockResolvedValue(detalheFake()),
    create: jest.fn(),
    registrarAnaliseDocumento: jest.fn(),
    registrarAnaliseFinal: jest.fn(),
    registrarConsultaCredito: jest.fn(),
    atualizarStatus: jest.fn(),
    atualizarDadosCadastrais: jest.fn(),
    salvarSica: jest.fn(),
    salvarTravelLink: jest.fn(),
    criarContrato: jest.fn(),
    atualizarStatusContrato: jest.fn(),
    listar: jest.fn(),
    obterKpis: jest.fn(),
    obterAnaliseContratos: jest.fn(),
    listarPorExecutivoId: jest.fn(),
    ...overrides,
  };
}

function analiseIaServiceFake(overrides: Partial<AnaliseIaService> = {}): AnaliseIaService {
  return {
    avaliar: jest.fn().mockResolvedValue({ aprovado: true, motivo: null } as AnaliseIaResultado),
    ...overrides,
  };
}

function sofiaConsultaServiceFake(
  overrides: Partial<SofiaConsultaService> = {},
): SofiaConsultaService {
  return {
    consultarPorCnpj: jest.fn().mockResolvedValue({ total: 0, records: [] }),
    ...overrides,
  };
}

describe("ReconsultarCreditoUseCase", () => {
  it("lança NotFoundError se a agência não existir", async () => {
    const agenciaRepository = repositorioFake({
      obterDetalhe: jest.fn().mockResolvedValue(null),
    });
    const useCase = new ReconsultarCreditoUseCase(
      agenciaRepository,
      analiseIaServiceFake(),
      sofiaConsultaServiceFake(),
    );

    await expect(
      useCase.execute({ agenciaId: "agencia-1", fonte: "SOFIA", consultadoPor: "analista@x.com" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  describe("fonte AMAT", () => {
    it("dispara a análise combinada e grava stage2/rawData integralmente", async () => {
      const agenciaRepository = repositorioFake();
      const resultado: AnaliseIaResultado = {
        aprovado: true,
        motivo: null,
        stage2: {
          amat: null,
          sofia: { status: "NAO_CONSTA" },
          processosJudiciais: null,
          reclamacoes: null,
          debtTotal: 0,
        },
        rawData: { amat: [{ tool: "search_amat_debts", args: null, output: {} }] },
      };
      const analiseIaService = analiseIaServiceFake({
        avaliar: jest.fn().mockResolvedValue(resultado),
      });
      const useCase = new ReconsultarCreditoUseCase(
        agenciaRepository,
        analiseIaService,
        sofiaConsultaServiceFake(),
      );

      await useCase.execute({
        agenciaId: "agencia-1",
        fonte: "AMAT",
        consultadoPor: "analista@x.com",
      });

      expect(analiseIaService.avaliar).toHaveBeenCalledWith(
        expect.objectContaining({ cnpj: "12345678000195" }),
      );
      expect(agenciaRepository.registrarConsultaCredito).toHaveBeenCalledWith("agencia-1", {
        fonte: "AMAT",
        sucesso: true,
        erro: null,
        stage2: resultado.stage2,
        rawData: resultado.rawData,
        consultadoPor: "analista@x.com",
      });
    });

    it("grava falha sem sobrescrever o stage2 atual quando a análise combinada lança erro", async () => {
      const agenciaRepository = repositorioFake();
      const analiseIaService = analiseIaServiceFake({
        avaliar: jest.fn().mockRejectedValue(new Error("timeout")),
      });
      const useCase = new ReconsultarCreditoUseCase(
        agenciaRepository,
        analiseIaService,
        sofiaConsultaServiceFake(),
      );

      await useCase.execute({
        agenciaId: "agencia-1",
        fonte: "AMAT",
        consultadoPor: "analista@x.com",
      });

      expect(agenciaRepository.registrarConsultaCredito).toHaveBeenCalledWith("agencia-1", {
        fonte: "AMAT",
        sucesso: false,
        erro: "Falha técnica na reconsulta: Error: timeout",
        stage2: null,
        rawData: null,
        consultadoPor: "analista@x.com",
      });
    });
  });

  describe("fonte SOFIA", () => {
    it("marca 'Nada consta' quando o endpoint devolve total 0, preservando AMAT já existente", async () => {
      const stage2Existente: AnaliseIaStage2 = {
        amat: {
          consultado: true,
          ultimaConsulta: "2026-07-20T00:00:00.000Z",
          empresa: null,
          sociosComRestricao: [],
          totalGeral: 0,
        },
        sofia: { status: "CONSTA", situacao: "antigo" },
        processosJudiciais: { verificado: true },
        reclamacoes: { total: 2 },
        debtTotal: 0,
      };
      const agenciaRepository = repositorioFake({
        obterDetalhe: jest.fn().mockResolvedValue(
          detalheFake({
            analiseIa: {
              resultado: "APROVADO" as never,
              parecer: "APROVADO",
              motivo: null,
              flagsRisco: [],
              detalhamento: null,
              stage1: null,
              stage2: stage2Existente,
              rawData: { amat: [{ tool: "search_amat_debts", args: null, output: {} }] },
              avaliadoEm: new Date("2026-07-20"),
            },
          }),
        ),
      });
      const sofiaConsultaService = sofiaConsultaServiceFake({
        consultarPorCnpj: jest.fn().mockResolvedValue({ total: 0, records: [] }),
      });
      const useCase = new ReconsultarCreditoUseCase(
        agenciaRepository,
        analiseIaServiceFake(),
        sofiaConsultaService,
      );

      await useCase.execute({
        agenciaId: "agencia-1",
        fonte: "SOFIA",
        consultadoPor: "analista@x.com",
      });

      expect(sofiaConsultaService.consultarPorCnpj).toHaveBeenCalledWith("12345678000195");
      const chamada = (agenciaRepository.registrarConsultaCredito as jest.Mock).mock.calls[0];
      expect(chamada[0]).toBe("agencia-1");
      expect(chamada[1]).toMatchObject({
        fonte: "SOFIA",
        sucesso: true,
        erro: null,
        consultadoPor: "analista@x.com",
      });
      expect(chamada[1].stage2).toEqual({
        amat: stage2Existente.amat,
        sofia: { status: "NAO_CONSTA" },
        processosJudiciais: stage2Existente.processosJudiciais,
        reclamacoes: stage2Existente.reclamacoes,
        debtTotal: stage2Existente.debtTotal,
      });
      expect(chamada[1].rawData.amat).toEqual([
        { tool: "search_amat_debts", args: null, output: {} },
      ]);
      expect(chamada[1].rawData.sofia).toEqual([
        {
          tool: "sofia_consulta_direta",
          args: { cnpj: "12345678000195" },
          output: { total: 0, records: [] },
        },
      ]);
    });

    it("marca 'CONSTA' e expõe os campos do registro quando o endpoint devolve total > 0", async () => {
      const agenciaRepository = repositorioFake();
      const registro = {
        id: 3343,
        empresaId: 11,
        razaoSocial: "SCHEIBE VIAGENS E TURISMO LTDA",
        cidade: "Porto Alegre",
        uf: "RS",
        situacao: "Indefinido",
        status: 1,
      };
      const sofiaConsultaService = sofiaConsultaServiceFake({
        consultarPorCnpj: jest.fn().mockResolvedValue({ total: 1, records: [registro] }),
      });
      const useCase = new ReconsultarCreditoUseCase(
        agenciaRepository,
        analiseIaServiceFake(),
        sofiaConsultaService,
      );

      await useCase.execute({
        agenciaId: "agencia-1",
        fonte: "SOFIA",
        consultadoPor: "analista@x.com",
      });

      const chamada = (agenciaRepository.registrarConsultaCredito as jest.Mock).mock.calls[0];
      expect(chamada[1].stage2.sofia).toEqual({
        status: "CONSTA",
        id: 3343,
        empresaId: 11,
        razaoSocial: "SCHEIBE VIAGENS E TURISMO LTDA",
        cidade: "Porto Alegre",
        uf: "RS",
        situacao: "Indefinido",
        statusRegistro: 1,
      });
    });

    it("grava falha sem chamar registrarConsultaCredito com dado parcial quando o endpoint direto lança erro", async () => {
      const agenciaRepository = repositorioFake();
      const sofiaConsultaService = sofiaConsultaServiceFake({
        consultarPorCnpj: jest.fn().mockRejectedValue(new Error("indisponível")),
      });
      const useCase = new ReconsultarCreditoUseCase(
        agenciaRepository,
        analiseIaServiceFake(),
        sofiaConsultaService,
      );

      await useCase.execute({
        agenciaId: "agencia-1",
        fonte: "SOFIA",
        consultadoPor: "analista@x.com",
      });

      expect(agenciaRepository.registrarConsultaCredito).toHaveBeenCalledWith("agencia-1", {
        fonte: "SOFIA",
        sucesso: false,
        erro: "Falha técnica na reconsulta: Error: indisponível",
        stage2: null,
        rawData: null,
        consultadoPor: "analista@x.com",
      });
    });
  });
});
