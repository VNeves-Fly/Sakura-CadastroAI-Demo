import { AnalisarCadastroUseCase } from "@/modules/cadastro/application/use-cases/analisar-cadastro.use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import {
  STATUS_EM_ANALISE,
  STATUS_EM_COMPLEMENTAR,
  STATUS_AGUARDANDO_ASSINATURA,
  type AgenciaDetalhe,
  type AgenciaRepository,
  type RepresentanteLegalDetalhe,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import type {
  AnaliseIaResultado,
  AnaliseIaService,
} from "@/modules/cadastro/domain/services/analise-ia-service";
import type {
  DocumentAnalysisResultado,
  DocumentAnalysisService,
} from "@/modules/cadastro/domain/services/document-analysis-service";
import type { DadosReceitaRepository } from "@/modules/cadastro/domain/repositories/dados-receita-repository";
import type { DocumentoRepository } from "@/modules/cadastro/domain/repositories/documento-repository";

const ENDERECO = {
  cep: "01310-100",
  logradouro: "Av Paulista",
  numero: "1000",
  complemento: "",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

// `parecer: "APROVADO"` — fixture representa o caminho feliz (documento
// aprovado na checagem individual); testes do gate de divergência (ver
// "todosDocumentosAprovados" em AnalisarCadastroUseCase) sobrescrevem
// isso explicitamente.
const ANALISE_VAZIA: DocumentAnalysisResultado = {
  camposExtraidos: {},
  camposExtras: {},
  confiancaExtracao: 0,
  alertas: [],
  resumoAnalise: null,
  textoBruto: null,
  checagens: null,
  parecer: "APROVADO",
  comparacaoOficial: null,
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
    rg: documentoFake("doc-rg-1", "agencias/12345678000195/socio-0-rg.pdf"),
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
    agencia: agenciaFake(STATUS_EM_ANALISE),
    complementar: {
      id: "complementar-1",
      telefoneComercial: "11988887777",
      emailOperacional: "operacional@example.com",
      emailComercial: "comercial@example.com",
      emailFinanceiro: "financeiro@example.com",
      enderecoAgencia: ENDERECO,
      enderecoAgenciaMesmoTitular: false,
      socioVinculadoEnderecoId: null,
      bancoPais: "nacional",
      bancoNome: "Banco Teste",
      bancoCodigo: "001",
      bancoAgencia: "1234",
      bancoConta: "56789-0",
      bancoSwift: "",
      tipoConta: "corrente",
      favorecidoEhEmpresa: true,
      favorecidoNome: "Empresa Teste Ltda",
      favorecidoDoc: "12345678000195",
    },
    representantesLegais: [socioFake()],
    contratoSocial: documentoFake("doc-contrato-1", "agencias/12345678000195/contrato-social.pdf"),
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
    atualizarStatus: jest.fn(),
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
    cancelarDocumento: jest.fn(),
    ...overrides,
  };
}

function criarAnaliseIaFake(overrides: Partial<AnaliseIaService> = {}): AnaliseIaService {
  return {
    avaliar: jest.fn().mockResolvedValue({ aprovado: true, motivo: null }),
    ...overrides,
  };
}

function criarDocumentAnalysisFake(
  overrides: Partial<DocumentAnalysisService> = {},
): DocumentAnalysisService {
  return {
    analisar: jest.fn().mockResolvedValue(ANALISE_VAZIA),
    ...overrides,
  };
}

function criarDadosReceitaFake(
  overrides: Partial<DadosReceitaRepository> = {},
): DadosReceitaRepository {
  return {
    findByAgenciaId: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
    ...overrides,
  };
}

interface Deps {
  agenciaRepository: AgenciaRepository;
  contratoAssinaturaService: ContratoAssinaturaService;
  analiseIaService: AnaliseIaService;
  documentAnalysisService: DocumentAnalysisService;
  dadosReceitaRepository: DadosReceitaRepository;
  documentoRepository: DocumentoRepository;
}

function criarDocumentoRepositoryFake(
  overrides: Partial<DocumentoRepository> = {},
): DocumentoRepository {
  return {
    findById: jest.fn(),
    findByAgenciaId: jest.fn(),
    findByRepresentanteLegalId: jest.fn(),
    create: jest.fn(),
    atualizarStatus: jest.fn(),
    ...overrides,
  };
}

function criarUseCase(overrides: Partial<Deps> = {}) {
  const deps: Deps = {
    agenciaRepository: criarRepositorioFake(),
    contratoAssinaturaService: criarContratoAssinaturaFake(),
    analiseIaService: criarAnaliseIaFake(),
    documentAnalysisService: criarDocumentAnalysisFake(),
    dadosReceitaRepository: criarDadosReceitaFake(),
    documentoRepository: criarDocumentoRepositoryFake(),
    ...overrides,
  };

  const useCase = new AnalisarCadastroUseCase(
    deps.agenciaRepository,
    deps.contratoAssinaturaService,
    deps.analiseIaService,
    deps.documentAnalysisService,
    deps.dadosReceitaRepository,
    deps.documentoRepository,
  );

  return { useCase, ...deps };
}

describe("AnalisarCadastroUseCase", () => {
  it("não faz nada (sem lançar erro) quando a agência não é encontrada", async () => {
    const { useCase, documentAnalysisService } = criarUseCase({
      agenciaRepository: criarRepositorioFake({ obterDetalhe: jest.fn().mockResolvedValue(null) }),
    });

    await expect(useCase.execute({ agenciaId: "inexistente" })).resolves.toBeUndefined();
    expect(documentAnalysisService.analisar).not.toHaveBeenCalled();
  });

  it("não faz nada quando o contrato social ainda não existe no detalhe", async () => {
    const { useCase, documentAnalysisService } = criarUseCase({
      agenciaRepository: criarRepositorioFake({
        obterDetalhe: jest.fn().mockResolvedValue(detalheFake({ contratoSocial: null })),
      }),
    });

    await expect(useCase.execute({ agenciaId: "agencia-1" })).resolves.toBeUndefined();
    expect(documentAnalysisService.analisar).not.toHaveBeenCalled();
  });

  it.each([
    "aguardando_assinatura",
    "aguardando_validacao",
    "aguardando_ativacao",
    "ativo",
    "recusado",
  ])(
    "lança ConflictError e não roda nada se a agência já avançou pro status %s",
    async (status) => {
      const { useCase, documentAnalysisService, analiseIaService, agenciaRepository } =
        criarUseCase({
          agenciaRepository: criarRepositorioFake({
            obterDetalhe: jest
              .fn()
              .mockResolvedValue(detalheFake({ agencia: agenciaFake(status) })),
          }),
        });

      await expect(useCase.execute({ agenciaId: "agencia-1" })).rejects.toThrow(ConflictError);
      expect(documentAnalysisService.analisar).not.toHaveBeenCalled();
      expect(analiseIaService.avaliar).not.toHaveBeenCalled();
      expect(agenciaRepository.registrarAnaliseFinal).not.toHaveBeenCalled();
    },
  );

  it.each([STATUS_EM_ANALISE, STATUS_EM_COMPLEMENTAR])(
    "roda normalmente quando o status é %s",
    async (status) => {
      const { useCase, analiseIaService } = criarUseCase({
        agenciaRepository: criarRepositorioFake({
          obterDetalhe: jest.fn().mockResolvedValue(detalheFake({ agencia: agenciaFake(status) })),
        }),
      });

      await useCase.execute({ agenciaId: "agencia-1" });

      expect(analiseIaService.avaliar).toHaveBeenCalled();
    },
  );

  it("analisa o contrato social e o RG de cada sócio, registrando cada um pelo id do documento certo", async () => {
    const { useCase, documentAnalysisService, agenciaRepository } = criarUseCase();

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(documentAnalysisService.analisar).toHaveBeenCalledWith(
      expect.objectContaining({
        documentPath: "agencias/12345678000195/contrato-social.pdf",
        documentType: "contrato_social",
      }),
    );
    expect(documentAnalysisService.analisar).toHaveBeenCalledWith(
      expect.objectContaining({
        documentPath: "agencias/12345678000195/socio-0-rg.pdf",
        documentType: "doc_identificacao",
      }),
    );
    expect(agenciaRepository.registrarAnaliseDocumento).toHaveBeenCalledWith(
      "doc-contrato-1",
      ANALISE_VAZIA,
    );
    expect(agenciaRepository.registrarAnaliseDocumento).toHaveBeenCalledWith(
      "doc-rg-1",
      ANALISE_VAZIA,
    );
  });

  it("não chama o serviço de análise pro RG de um sócio que ainda não enviou documento (rg null)", async () => {
    const { useCase, documentAnalysisService, agenciaRepository } = criarUseCase({
      agenciaRepository: criarRepositorioFake({
        obterDetalhe: jest
          .fn()
          .mockResolvedValue(detalheFake({ representantesLegais: [socioFake({ rg: null })] })),
      }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(documentAnalysisService.analisar).toHaveBeenCalledTimes(1); // só o contrato social
    expect(agenciaRepository.registrarAnaliseDocumento).toHaveBeenCalledTimes(1); // idem
  });

  it("quando a avaliação da IA lança exceção, registra FALHA_ANALISE em em_complementar e não mexe em contrato", async () => {
    const erro = new Error("agents-service indisponível");
    const { useCase, agenciaRepository, contratoAssinaturaService } = criarUseCase({
      analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockRejectedValue(erro) }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(agenciaRepository.registrarAnaliseFinal).toHaveBeenCalledWith(
      "agencia-1",
      expect.objectContaining({
        aprovado: false,
        motivo: expect.stringContaining("agents-service indisponível"),
      }),
      STATUS_EM_COMPLEMENTAR,
      "FALHA_ANALISE",
    );
    expect(contratoAssinaturaService.gerarEEnviar).not.toHaveBeenCalled();
    expect(agenciaRepository.criarContrato).not.toHaveBeenCalled();
  });

  it("quando a IA aprova e o contrato é gerado com sucesso, cria o contrato e registra APROVADO em aguardando_assinatura", async () => {
    const analiseIa: AnaliseIaResultado = { aprovado: true, motivo: null, parecer: "APROVADO" };
    const { useCase, agenciaRepository, contratoAssinaturaService } = criarUseCase({
      analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockResolvedValue(analiseIa) }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    const signatarioEsperado = {
      nome: "Fulano de Tal",
      email: "fulano@example.com",
      cpf: "12345678909",
      rgNumero: null,
      rgOrgaoEmissor: null,
      nacionalidade: null,
      estadoCivil: "solteiro",
      dataNascimento: new Date("1990-01-01"),
      endereco: ENDERECO,
    };

    expect(contratoAssinaturaService.gerarEEnviar).toHaveBeenCalledWith(
      expect.objectContaining({
        cnpj: "12345678000195",
        razaoSocial: "Empresa Teste Ltda",
        endereco: ENDERECO,
        signatarios: [signatarioEsperado],
      }),
    );
    expect(agenciaRepository.criarContrato).toHaveBeenCalledWith("agencia-1", {
      provedorId: "d4sign-1",
      status: "aguardando_assinatura",
      origemGeracao: "ia",
      signatarios: [signatarioEsperado],
    });
    expect(agenciaRepository.registrarAnaliseFinal).toHaveBeenCalledWith(
      "agencia-1",
      analiseIa,
      STATUS_AGUARDANDO_ASSINATURA,
      "APROVADO",
    );
  });

  it("quando a IA aprova o cadastro no geral mas reprova o contrato social na checagem individual, vai pra em_complementar (não gera contrato)", async () => {
    const analiseIa: AnaliseIaResultado = { aprovado: true, motivo: null, parecer: "APROVADO" };
    const { useCase, agenciaRepository, contratoAssinaturaService, documentoRepository } =
      criarUseCase({
        analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockResolvedValue(analiseIa) }),
        documentAnalysisService: criarDocumentAnalysisFake({
          analisar: jest.fn().mockResolvedValue({ ...ANALISE_VAZIA, parecer: "REPROVADO" }),
        }),
      });

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(contratoAssinaturaService.gerarEEnviar).not.toHaveBeenCalled();
    expect(agenciaRepository.criarContrato).not.toHaveBeenCalled();
    expect(documentoRepository.atualizarStatus).not.toHaveBeenCalled();
    expect(agenciaRepository.registrarAnaliseFinal).toHaveBeenCalledWith(
      "agencia-1",
      expect.objectContaining({
        motivo: expect.stringContaining("reprovou (ou não avaliou) ao menos um documento"),
      }),
      STATUS_EM_COMPLEMENTAR,
      "REPROVADO",
    );
  });

  it("aprova o contrato social sozinho quando só ele passa na checagem individual (RG do sócio reprovado não deve travar o contrato social em pendente)", async () => {
    const analiseIa: AnaliseIaResultado = { aprovado: true, motivo: null, parecer: "APROVADO" };
    const { useCase, documentoRepository } = criarUseCase({
      analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockResolvedValue(analiseIa) }),
      documentAnalysisService: criarDocumentAnalysisFake({
        analisar: jest
          .fn()
          .mockImplementation(async (input) =>
            input.documentType === "doc_identificacao"
              ? { ...ANALISE_VAZIA, parecer: "REPROVADO" }
              : ANALISE_VAZIA,
          ),
      }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(documentoRepository.atualizarStatus).toHaveBeenCalledWith(
      "doc-contrato-1",
      expect.objectContaining({ status: "APROVADO", aprovadoPor: "IA (aprovação automática)" }),
    );
    expect(documentoRepository.atualizarStatus).not.toHaveBeenCalledWith(
      "doc-rg-1",
      expect.anything(),
    );
  });

  it("quando a IA aprova o cadastro e todos os documentos são aprovados na checagem individual, aprova cada documento automaticamente", async () => {
    const analiseIa: AnaliseIaResultado = { aprovado: true, motivo: null, parecer: "APROVADO" };
    const { useCase, documentoRepository } = criarUseCase({
      analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockResolvedValue(analiseIa) }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(documentoRepository.atualizarStatus).toHaveBeenCalledWith(
      "doc-contrato-1",
      expect.objectContaining({ status: "APROVADO", aprovadoPor: "IA (aprovação automática)" }),
    );
    expect(documentoRepository.atualizarStatus).toHaveBeenCalledWith(
      "doc-rg-1",
      expect.objectContaining({ status: "APROVADO", aprovadoPor: "IA (aprovação automática)" }),
    );
  });

  it("quando o contrato social é reprovado só por CNPJ ausente, trata como aprovado e segue pro contrato", async () => {
    const analiseIa: AnaliseIaResultado = { aprovado: true, motivo: null, parecer: "APROVADO" };
    const { useCase, agenciaRepository, contratoAssinaturaService, documentoRepository } =
      criarUseCase({
        analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockResolvedValue(analiseIa) }),
        documentAnalysisService: criarDocumentAnalysisFake({
          analisar: jest.fn().mockImplementation(async (input) =>
            input.documentType === "contrato_social"
              ? {
                  ...ANALISE_VAZIA,
                  parecer: "REPROVADO",
                  alertas: [
                    "Info: Contrato Social formal identificado e validado.",
                    "Erro: CNPJ não encontrado no documento (campo obrigatório no schema, mas não presente no documento).",
                  ],
                }
              : ANALISE_VAZIA,
          ),
        }),
      });

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(agenciaRepository.registrarAnaliseDocumento).toHaveBeenCalledWith(
      "doc-contrato-1",
      expect.objectContaining({ parecer: "APROVADO" }),
    );
    expect(contratoAssinaturaService.gerarEEnviar).toHaveBeenCalled();
    expect(documentoRepository.atualizarStatus).toHaveBeenCalledWith(
      "doc-contrato-1",
      expect.objectContaining({ status: "APROVADO" }),
    );
  });

  it("quando o contrato social é reprovado por CNPJ ausente E outro alerta, continua reprovado (não sobrescreve)", async () => {
    const analiseIa: AnaliseIaResultado = { aprovado: true, motivo: null, parecer: "APROVADO" };
    const { useCase, contratoAssinaturaService } = criarUseCase({
      analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockResolvedValue(analiseIa) }),
      documentAnalysisService: criarDocumentAnalysisFake({
        analisar: jest.fn().mockImplementation(async (input) =>
          input.documentType === "contrato_social"
            ? {
                ...ANALISE_VAZIA,
                parecer: "REPROVADO",
                alertas: [
                  "Erro: CNPJ não encontrado no documento.",
                  "Erro: Assinatura digital ausente.",
                ],
              }
            : ANALISE_VAZIA,
        ),
      }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(contratoAssinaturaService.gerarEEnviar).not.toHaveBeenCalled();
  });

  it("exclui da lista de signatarios o sócio marcado administrativo=false, mas inclui administrativo=null/true", async () => {
    const analiseIa: AnaliseIaResultado = { aprovado: true, motivo: null, parecer: "APROVADO" };
    const naoAssina = socioFake({
      id: "socio-2",
      nome: "Nao Assina",
      cpf: "98765432100",
      administrativo: false,
    });
    const assinaPorPadrao = socioFake({
      id: "socio-3",
      nome: "Assina Padrao",
      administrativo: null,
    });
    const { useCase, contratoAssinaturaService } = criarUseCase({
      analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockResolvedValue(analiseIa) }),
      agenciaRepository: criarRepositorioFake({
        obterDetalhe: jest
          .fn()
          .mockResolvedValue(
            detalheFake({ representantesLegais: [socioFake(), naoAssina, assinaPorPadrao] }),
          ),
      }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    const [{ signatarios }] = (contratoAssinaturaService.gerarEEnviar as jest.Mock).mock.calls[0];
    expect(signatarios.map((s: { nome: string }) => s.nome)).toEqual([
      "Fulano de Tal",
      "Assina Padrao",
    ]);
  });

  it("usa endereço vazio pro contrato quando não há CadastroComplementar", async () => {
    const { useCase, contratoAssinaturaService } = criarUseCase({
      agenciaRepository: criarRepositorioFake({
        obterDetalhe: jest.fn().mockResolvedValue(detalheFake({ complementar: null })),
      }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(contratoAssinaturaService.gerarEEnviar).toHaveBeenCalledWith(
      expect.objectContaining({
        endereco: {
          cep: "",
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          uf: "",
        },
      }),
    );
  });

  it("quando a IA aprova mas o D4Sign falha, preserva o veredito da IA e registra FALHA_CONTRATO em em_complementar, sem criar contrato", async () => {
    const analiseIa: AnaliseIaResultado = { aprovado: true, motivo: null, parecer: "APROVADO" };
    const erroD4Sign = new Error("D4Sign fora do ar");
    const { useCase, agenciaRepository } = criarUseCase({
      analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockResolvedValue(analiseIa) }),
      contratoAssinaturaService: criarContratoAssinaturaFake({
        gerarEEnviar: jest.fn().mockRejectedValue(erroD4Sign),
      }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(agenciaRepository.criarContrato).not.toHaveBeenCalled();
    expect(agenciaRepository.registrarAnaliseFinal).toHaveBeenCalledWith(
      "agencia-1",
      expect.objectContaining({
        aprovado: true,
        motivo: expect.stringContaining("D4Sign fora do ar"),
      }),
      STATUS_EM_COMPLEMENTAR,
      "FALHA_CONTRATO",
    );
  });

  it("preserva o motivo original da IA junto do erro técnico quando o contrato falha e a IA já tinha um motivo", async () => {
    const analiseIa: AnaliseIaResultado = {
      aprovado: true,
      motivo: "aprovado com ressalvas menores",
    };
    const { useCase, agenciaRepository } = criarUseCase({
      analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockResolvedValue(analiseIa) }),
      contratoAssinaturaService: criarContratoAssinaturaFake({
        gerarEEnviar: jest.fn().mockRejectedValue(new Error("timeout")),
      }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    const chamada = (agenciaRepository.registrarAnaliseFinal as jest.Mock).mock.calls[0];
    expect(chamada[1].motivo).toContain("timeout");
    expect(chamada[1].motivo).toContain("aprovado com ressalvas menores");
  });

  it("quando a IA reprova, registra REPROVADO em em_complementar sem tocar em contrato", async () => {
    const analiseIa: AnaliseIaResultado = { aprovado: false, motivo: "CNPJ inválido" };
    const { useCase, agenciaRepository, contratoAssinaturaService } = criarUseCase({
      analiseIaService: criarAnaliseIaFake({ avaliar: jest.fn().mockResolvedValue(analiseIa) }),
    });

    await useCase.execute({ agenciaId: "agencia-1" });

    expect(contratoAssinaturaService.gerarEEnviar).not.toHaveBeenCalled();
    expect(agenciaRepository.criarContrato).not.toHaveBeenCalled();
    expect(agenciaRepository.registrarAnaliseFinal).toHaveBeenCalledWith(
      "agencia-1",
      analiseIa,
      STATUS_EM_COMPLEMENTAR,
      "REPROVADO",
    );
  });

  describe("cache de Dados da Receita (best-effort)", () => {
    it("não grava nada quando não há situação cadastral, capital social nem endereço extraídos", async () => {
      const { useCase, dadosReceitaRepository } = criarUseCase();

      await useCase.execute({ agenciaId: "agencia-1" });

      expect(dadosReceitaRepository.create).not.toHaveBeenCalled();
      expect(dadosReceitaRepository.update).not.toHaveBeenCalled();
    });

    it("cria Dados da Receita quando o contrato social trouxe capital social extraído e ainda não existe registro", async () => {
      const { useCase, dadosReceitaRepository } = criarUseCase({
        documentAnalysisService: criarDocumentAnalysisFake({
          analisar: jest
            .fn()
            .mockResolvedValueOnce({
              ...ANALISE_VAZIA,
              camposExtraidos: { capital_social: "100.000,00" },
            })
            .mockResolvedValue(ANALISE_VAZIA),
        }),
        dadosReceitaRepository: criarDadosReceitaFake({
          findByAgenciaId: jest.fn().mockResolvedValue(null),
        }),
      });

      await useCase.execute({ agenciaId: "agencia-1" });

      expect(dadosReceitaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ agenciaId: "agencia-1", capitalSocial: 100000 }),
      );
      expect(dadosReceitaRepository.update).not.toHaveBeenCalled();
    });

    it("atualiza (em vez de criar) quando já existe um registro de Dados da Receita pra essa agência", async () => {
      const { useCase, dadosReceitaRepository } = criarUseCase({
        documentAnalysisService: criarDocumentAnalysisFake({
          analisar: jest
            .fn()
            .mockResolvedValueOnce({ ...ANALISE_VAZIA, camposExtraidos: { capital_social: 50000 } })
            .mockResolvedValue(ANALISE_VAZIA),
        }),
        dadosReceitaRepository: criarDadosReceitaFake({
          findByAgenciaId: jest.fn().mockResolvedValue({ id: "dr-1" } as never),
        }),
      });

      await useCase.execute({ agenciaId: "agencia-1" });

      expect(dadosReceitaRepository.update).toHaveBeenCalledWith(
        "agencia-1",
        expect.objectContaining({ capitalSocial: 50000 }),
      );
      expect(dadosReceitaRepository.create).not.toHaveBeenCalled();
    });

    it("não derruba o fluxo se falhar ao persistir Dados da Receita (best-effort)", async () => {
      const { useCase, agenciaRepository } = criarUseCase({
        documentAnalysisService: criarDocumentAnalysisFake({
          analisar: jest
            .fn()
            .mockResolvedValueOnce({ ...ANALISE_VAZIA, camposExtraidos: { capital_social: 1000 } })
            .mockResolvedValue(ANALISE_VAZIA),
        }),
        dadosReceitaRepository: criarDadosReceitaFake({
          findByAgenciaId: jest.fn().mockRejectedValue(new Error("db fora do ar")),
        }),
      });

      await expect(useCase.execute({ agenciaId: "agencia-1" })).resolves.toBeUndefined();
      // O resultado da IA ainda foi registrado normalmente, apesar da falha no best-effort.
      expect(agenciaRepository.registrarAnaliseFinal).toHaveBeenCalled();
    });
  });
});
