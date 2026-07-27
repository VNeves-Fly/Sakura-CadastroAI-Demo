import {
  AprovarCadastroComplementarUseCase,
  type AprovarCadastroComplementarInput,
} from "@/modules/cadastro/application/use-cases/aprovar-cadastro-complementar.use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import {
  STATUS_EM_COMPLEMENTAR,
  STATUS_AGUARDANDO_ASSINATURA,
  type AgenciaDetalhe,
  type AgenciaRepository,
  type RepresentanteLegalDetalhe,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { StatusDocumento } from "@/modules/cadastro/domain/enums";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type { DecisaoHumanaRepository } from "@/modules/cadastro/domain/repositories/decisao-humana-repository";

const ENDERECO = {
  cep: "01310-100",
  logradouro: "Av Paulista",
  numero: "1000",
  complemento: "",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

function agenciaFake(status: string): Agencia {
  return Agencia.create({
    id: "agencia-1",
    razaoSocial: "Empresa Teste Ltda",
    cnpj: "12345678000195",
    etapaAtual: 1,
    status,
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

function documentoFake(status: StatusDocumento, id = "doc-1"): Documento {
  return Documento.create({
    id,
    agenciaId: "agencia-1",
    representanteLegalId: null,
    tipo: "RG_CNPJ",
    fileName: null,
    mimeType: null,
    gcsPath: "agencias/12345678000195/doc.pdf",
    gcsBucket: "bucket",
    gcsSize: null,
    gcsMd5: null,
    status,
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

function socioFake(overrides: Partial<RepresentanteLegalDetalhe> = {}): RepresentanteLegalDetalhe {
  return {
    id: "socio-1",
    nome: "Fulano de Tal",
    cpf: "12345678909",
    email: "fulano@example.com",
    telefone: "11999998888",
    estadoCivil: "solteiro",
    isRepresentanteLegal: false,
    endereco: ENDERECO,
    rg: null,
    procuracao: null,
    rgNumero: null,
    rgOrgaoEmissor: null,
    nacionalidade: null,
    dataNascimento: new Date("1990-01-01"),
    administrativo: null,
    ...overrides,
  };
}

function detalheFake(overrides: Partial<AgenciaDetalhe> = {}): AgenciaDetalhe {
  return {
    agencia: agenciaFake(STATUS_EM_COMPLEMENTAR),
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

function criarRepositorioFake(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findByCnpj: jest.fn(),
    findById: jest.fn(),
    findByContratoProvedorId: jest.fn(),
    obterDetalhe: jest.fn().mockResolvedValue(detalheFake()),
    create: jest.fn(),
    registrarAnaliseDocumento: jest.fn(),
    registrarAnaliseFinal: jest.fn(),
    registrarConsultaCredito: jest.fn(),
    atualizarStatus: jest.fn().mockResolvedValue(agenciaFake(STATUS_AGUARDANDO_ASSINATURA)),
    salvarSica: jest.fn(),
    salvarTravelLink: jest.fn(),
    criarContrato: jest.fn(),
    atualizarStatusContrato: jest.fn(),
    listar: jest.fn(),
    obterKpis: jest.fn(),
    obterAnaliseContratos: jest.fn(),
    listarPorExecutivoId: jest.fn(),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function criarContratoAssinaturaFake(
  overrides: Partial<ContratoAssinaturaService> = {},
): ContratoAssinaturaService {
  return {
    gerarEEnviar: jest
      .fn()
      .mockResolvedValue({ provedorId: "d4sign-1", status: "aguardando_assinatura" }),
    visualizarDocumento: jest.fn(),
    obterDocumento: jest.fn(),
    obterDestinatarios: jest.fn(),
    registrarWebhook: jest.fn(),
    ...overrides,
  };
}

function criarDecisaoHumanaFake(
  overrides: Partial<DecisaoHumanaRepository> = {},
): DecisaoHumanaRepository {
  return {
    findByAgenciaId: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    ...overrides,
  };
}

interface Deps {
  agenciaRepository: AgenciaRepository;
  contratoAssinaturaService: ContratoAssinaturaService;
  decisaoHumanaRepository: DecisaoHumanaRepository;
}

function criarUseCase(overrides: Partial<Deps> = {}) {
  const deps: Deps = {
    agenciaRepository: criarRepositorioFake(),
    contratoAssinaturaService: criarContratoAssinaturaFake(),
    decisaoHumanaRepository: criarDecisaoHumanaFake(),
    ...overrides,
  };

  const useCase = new AprovarCadastroComplementarUseCase(
    deps.agenciaRepository,
    deps.contratoAssinaturaService,
    deps.decisaoHumanaRepository,
  );

  return { useCase, ...deps };
}

const INPUT: AprovarCadastroComplementarInput = {
  id: "agencia-1",
  analistaEmail: "analista@example.com",
};

describe("AprovarCadastroComplementarUseCase", () => {
  it("lança NotFoundError quando a agência não existe", async () => {
    const { useCase } = criarUseCase({
      agenciaRepository: criarRepositorioFake({ obterDetalhe: jest.fn().mockResolvedValue(null) }),
    });

    await expect(useCase.execute(INPUT)).rejects.toThrow(NotFoundError);
  });

  it("lança ConflictError quando a agência não está em em_complementar", async () => {
    const { useCase } = criarUseCase({
      agenciaRepository: criarRepositorioFake({
        obterDetalhe: jest
          .fn()
          .mockResolvedValue(detalheFake({ agencia: agenciaFake(STATUS_AGUARDANDO_ASSINATURA) })),
      }),
    });

    await expect(useCase.execute(INPUT)).rejects.toThrow(ConflictError);
  });

  it("gera o contrato e move a agência pra aguardando_assinatura", async () => {
    const { useCase, contratoAssinaturaService, agenciaRepository } = criarUseCase();

    const resultado = await useCase.execute(INPUT);

    expect(contratoAssinaturaService.gerarEEnviar).toHaveBeenCalled();
    expect(agenciaRepository.criarContrato).toHaveBeenCalledWith(
      "agencia-1",
      expect.objectContaining({ origemGeracao: "humano" }),
    );
    expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith(
      "agencia-1",
      STATUS_AGUARDANDO_ASSINATURA,
    );
    expect(resultado.status).toBe(STATUS_AGUARDANDO_ASSINATURA);
  });

  it("registra a DecisaoHumana com quem aprovou, marcando divergência quando a IA tinha reprovado", async () => {
    const { useCase, decisaoHumanaRepository } = criarUseCase({
      agenciaRepository: criarRepositorioFake({
        obterDetalhe: jest.fn().mockResolvedValue(
          detalheFake({
            analiseIa: {
              resultado: "REPROVADO",
              parecer: "REPROVADO",
              motivo: "CNAE incompatível",
              flagsRisco: [],
              detalhamento: null,
              stage2: null,
              rawData: null,
              avaliadoEm: new Date("2026-01-02"),
            },
          }),
        ),
      }),
    });

    await useCase.execute(INPUT);

    expect(decisaoHumanaRepository.create).toHaveBeenCalledWith({
      agenciaId: "agencia-1",
      etapa: "COMPLEMENTAR",
      decisaoHumana: "APROVADO",
      decisaoIa: "REPROVADO",
      divergiu: true,
      usuarioEmail: "analista@example.com",
    });
  });

  it("registra divergiu=false quando a fila veio de falha técnica, não de reprovação real da IA", async () => {
    const { useCase, decisaoHumanaRepository } = criarUseCase({
      agenciaRepository: criarRepositorioFake({
        obterDetalhe: jest.fn().mockResolvedValue(
          detalheFake({
            analiseIa: {
              resultado: "FALHA_CONTRATO",
              parecer: "APROVADO",
              motivo: "D4Sign indisponível",
              flagsRisco: [],
              detalhamento: null,
              stage2: null,
              rawData: null,
              avaliadoEm: new Date("2026-01-02"),
            },
          }),
        ),
      }),
    });

    await useCase.execute(INPUT);

    expect(decisaoHumanaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ decisaoIa: "APROVADO", divergiu: false }),
    );
  });

  it.each<StatusDocumento>(["PENDENTE", "REPROVADO"])(
    "lança ConflictError quando o contrato social está %s",
    async (status) => {
      const { useCase, contratoAssinaturaService } = criarUseCase({
        agenciaRepository: criarRepositorioFake({
          obterDetalhe: jest
            .fn()
            .mockResolvedValue(detalheFake({ contratoSocial: documentoFake(status) })),
        }),
      });

      await expect(useCase.execute(INPUT)).rejects.toThrow(ConflictError);
      expect(contratoAssinaturaService.gerarEEnviar).not.toHaveBeenCalled();
    },
  );

  it("lança ConflictError quando o RG de um sócio está reprovado, listando o nome do sócio", async () => {
    const { useCase } = criarUseCase({
      agenciaRepository: criarRepositorioFake({
        obterDetalhe: jest.fn().mockResolvedValue(
          detalheFake({
            representantesLegais: [socioFake({ rg: documentoFake("REPROVADO") })],
          }),
        ),
      }),
    });

    await expect(useCase.execute(INPUT)).rejects.toThrow(/RG\/CNH — Fulano de Tal/);
  });

  it("aprova normalmente quando o contrato social e os documentos dos sócios estão aprovados", async () => {
    const { useCase, contratoAssinaturaService } = criarUseCase({
      agenciaRepository: criarRepositorioFake({
        obterDetalhe: jest.fn().mockResolvedValue(
          detalheFake({
            contratoSocial: documentoFake("APROVADO", "doc-contrato"),
            representantesLegais: [
              socioFake({ rg: documentoFake("APROVADO", "doc-rg"), procuracao: null }),
            ],
          }),
        ),
      }),
    });

    await useCase.execute(INPUT);

    expect(contratoAssinaturaService.gerarEEnviar).toHaveBeenCalled();
  });

  it("aprova normalmente quando o sócio ainda não enviou RG (slot null não bloqueia)", async () => {
    const { useCase, contratoAssinaturaService } = criarUseCase({
      agenciaRepository: criarRepositorioFake({
        obterDetalhe: jest.fn().mockResolvedValue(
          detalheFake({
            contratoSocial: null,
            representantesLegais: [socioFake({ rg: null, procuracao: null })],
          }),
        ),
      }),
    });

    await useCase.execute(INPUT);

    expect(contratoAssinaturaService.gerarEEnviar).toHaveBeenCalled();
  });

  it("não interrompe o fluxo (nem lança) se a gravação da DecisaoHumana falhar", async () => {
    const { useCase, agenciaRepository } = criarUseCase({
      decisaoHumanaRepository: criarDecisaoHumanaFake({
        create: jest.fn().mockRejectedValue(new Error("db fora do ar")),
      }),
    });

    const resultado = await useCase.execute(INPUT);

    expect(resultado.status).toBe(STATUS_AGUARDANDO_ASSINATURA);
    expect(agenciaRepository.atualizarStatus).toHaveBeenCalled();
  });
});
