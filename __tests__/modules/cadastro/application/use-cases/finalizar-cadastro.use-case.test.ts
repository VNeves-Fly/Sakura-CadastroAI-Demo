import { FinalizarCadastroUseCase } from "@/modules/cadastro/application/use-cases/finalizar-cadastro.use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import {
  STATUS_EM_ANALISE,
  type AgenciaRepository,
  type CreateAgenciaData,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type { ExecutivoResolver } from "@/modules/cadastro/domain/repositories/executivo-resolver";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type {
  EnderecoBancoSubmitInput,
  FinalizarCadastroInput,
  SocioSubmitInput,
} from "@/modules/cadastro/application/dto/finalizar-cadastro.dto";

const ARQUIVO = {
  buffer: Buffer.from("pdf"),
  originalName: "arquivo.pdf",
  mimeType: "application/pdf",
};

const ENDERECO_SOCIO = {
  cep: "01310-100",
  logradouro: "Av Paulista",
  numero: "1000",
  complemento: "",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

function socioFake(overrides: Partial<SocioSubmitInput> = {}): SocioSubmitInput {
  return {
    nome: "Fulano de Tal",
    cpf: "12345678909",
    email: "fulano@example.com",
    telefone: "11999998888",
    dataNascimento: "1990-01-01",
    estadoCivil: "solteiro",
    rgNumero: "",
    rgOrgaoEmissor: "",
    nacionalidade: "Brasileiro(a)",
    administrativo: null,
    endereco: ENDERECO_SOCIO,
    rg: ARQUIVO,
    isRepresentante: false,
    procuracao: null,
    ...overrides,
  };
}

function enderecoBancoFake(
  overrides: Partial<EnderecoBancoSubmitInput> = {},
): EnderecoBancoSubmitInput {
  return {
    enderecoMesmoSocio: false,
    socioEnderecoVinculado: null,
    endereco: {
      cep: "04121-002",
      logradouro: "Rua Banco",
      numero: "50",
      complemento: "",
      bairro: "Vila Mariana",
      cidade: "São Paulo",
      uf: "SP",
    },
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
    ...overrides,
  };
}

function inputFake(overrides: Partial<FinalizarCadastroInput> = {}): FinalizarCadastroInput {
  return {
    cnpj: "12345678000195",
    razaoSocial: "Empresa Teste Ltda",
    contratoSocial: ARQUIVO,
    origem: null,
    executivoId: null,
    associacaoId: null,
    eventoId: null,
    telefoneComercial: "11988887777",
    emailOperacional: "operacional@example.com",
    emailComercial: "comercial@example.com",
    emailFinanceiro: "financeiro@example.com",
    socios: [socioFake()],
    enderecoBanco: enderecoBancoFake(),
    ...overrides,
  };
}

function criarRepositorioFake(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findByCnpj: jest.fn().mockResolvedValue(null),
    findById: jest.fn(),
    findByContratoProvedorId: jest.fn(),
    obterDetalhe: jest.fn(),
    create: jest.fn().mockImplementation((data: CreateAgenciaData) =>
      Promise.resolve(
        Agencia.create({
          id: "agencia-1",
          razaoSocial: data.razaoSocial,
          cnpj: data.cnpj,
          etapaAtual: 1,
          status: data.status,
          contratoSocialPath: data.contratoSocialPath,
          emailContato: data.emailContato,
          telefoneContato: data.telefoneContato,
          origem: data.origem,
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-01-01"),
          sicaCodigo: null,
          sicaSalvoPor: null,
          sicaSalvoEm: null,
          travelLinkCriado: false,
          travelLinkSalvoPor: null,
          travelLinkSalvoEm: null,
        }),
      ),
    ),
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
    listarPorExecutivoId: jest.fn(),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function criarFileStorageFake(): FileStorage {
  let contador = 0;
  return {
    save: jest.fn().mockImplementation((_arquivo: unknown, pathHint: string) => {
      contador += 1;
      return Promise.resolve({ path: `${pathHint}-${contador}.pdf`, bucket: "meu-bucket" });
    }),
  };
}

function criarExecutivoResolverFake(overrides: Partial<ExecutivoResolver> = {}): ExecutivoResolver {
  return {
    resolve: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe("FinalizarCadastroUseCase", () => {
  it("lança ConflictError e não salva nada quando o CNPJ já está cadastrado", async () => {
    const agenciaRepository = criarRepositorioFake({
      findByCnpj: jest.fn().mockResolvedValue(
        Agencia.create({
          id: "existente",
          razaoSocial: "Já Existe Ltda",
          cnpj: "12345678000195",
          etapaAtual: 1,
          status: STATUS_EM_ANALISE,
          contratoSocialPath: "x",
          emailContato: "x@x.com",
          telefoneContato: "119999999999",
          origem: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          sicaCodigo: null,
          sicaSalvoPor: null,
          sicaSalvoEm: null,
          travelLinkCriado: false,
          travelLinkSalvoPor: null,
          travelLinkSalvoEm: null,
        }),
      ),
    });
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await expect(useCase.execute(inputFake())).rejects.toThrow(ConflictError);
    expect(fileStorage.save).not.toHaveBeenCalled();
    expect(agenciaRepository.create).not.toHaveBeenCalled();
  });

  it("salva o contrato social e o RG de cada sócio no storage antes de persistir", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(inputFake());

    expect(fileStorage.save).toHaveBeenCalledWith(
      ARQUIVO,
      "agencias/12345678000195/contrato-social",
    );
    expect(fileStorage.save).toHaveBeenCalledWith(ARQUIVO, "agencias/12345678000195/socio-0-rg");
  });

  it("também salva a procuração quando o sócio é representante", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const procuracao = {
      buffer: Buffer.from("proc"),
      originalName: "proc.pdf",
      mimeType: "application/pdf",
    };
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(
      inputFake({ socios: [socioFake({ isRepresentante: true, procuracao })] }),
    );

    expect(fileStorage.save).toHaveBeenCalledWith(
      procuracao,
      "agencias/12345678000195/socio-0-procuracao",
    );
  });

  it("não tenta salvar procuração quando o sócio não é representante (procuracao null)", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(
      inputFake({ socios: [socioFake({ isRepresentante: false, procuracao: null })] }),
    );

    const chamadasComProcuracao = (fileStorage.save as jest.Mock).mock.calls.filter(
      ([, pathHint]) => String(pathHint).includes("procuracao"),
    );
    expect(chamadasComProcuracao).toHaveLength(0);
  });

  it("persiste a Agência sempre com status em_analise, independente do que a IA vai decidir depois", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(inputFake());

    expect(agenciaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: STATUS_EM_ANALISE }),
    );
  });

  it("usa o CNPJ como razão social quando o wizard não extraiu nenhuma (contrato social ilegível)", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(inputFake({ razaoSocial: "" }));

    expect(agenciaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ razaoSocial: "12345678000195" }),
    );
  });

  it("copia o endereço do sócio vinculado quando enderecoMesmoSocio é true", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(
      inputFake({
        socios: [socioFake({ endereco: ENDERECO_SOCIO })],
        enderecoBanco: enderecoBancoFake({
          enderecoMesmoSocio: true,
          socioEnderecoVinculado: 0,
          endereco: null,
        }),
      }),
    );

    expect(agenciaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        enderecoBanco: expect.objectContaining({ endereco: ENDERECO_SOCIO }),
      }),
    );
  });

  it("usa o endereço do formulário de banco quando enderecoMesmoSocio é false", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const enderecoBancoProprio = enderecoBancoFake().endereco!;
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(inputFake());

    expect(agenciaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        enderecoBanco: expect.objectContaining({ endereco: enderecoBancoProprio }),
      }),
    );
  });

  it("cai num endereço vazio (nunca undefined/erro) se enderecoMesmoSocio aponta pra um índice de sócio inexistente", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(
      inputFake({
        enderecoBanco: enderecoBancoFake({
          enderecoMesmoSocio: true,
          socioEnderecoVinculado: 5,
          endereco: null,
        }),
      }),
    );

    expect(agenciaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        enderecoBanco: expect.objectContaining({
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
      }),
    );
  });

  it("devolve id/cnpj/razaoSocial/status vindos da Agência criada, sem inventar campos (sem precisaRevisaoManual/contratoStatus)", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    const resultado = await useCase.execute(inputFake());

    expect(resultado).toEqual({
      id: "agencia-1",
      cnpj: "12345678000195",
      razaoSocial: "Empresa Teste Ltda",
      status: STATUS_EM_ANALISE,
    });
  });

  it("resolve o executivoId cru (link pessoal ou de evento) via ExecutivoResolver antes de persistir", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake({
      resolve: jest.fn().mockResolvedValue("promotor-1"),
    });
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(inputFake({ executivoId: "uuid-do-link-pessoal" }));

    expect(executivoResolver.resolve).toHaveBeenCalledWith("uuid-do-link-pessoal");
    expect(agenciaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ executivoId: "promotor-1" }),
    );
  });

  it("não chama o ExecutivoResolver e grava executivoId null quando o cadastro não veio de um link", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(inputFake({ executivoId: null }));

    expect(executivoResolver.resolve).not.toHaveBeenCalled();
    expect(agenciaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ executivoId: null }),
    );
  });

  it("repassa associacaoId/eventoId direto pro repository, sem resolução (já vêm resolvidos do form)", async () => {
    const agenciaRepository = criarRepositorioFake();
    const fileStorage = criarFileStorageFake();
    const executivoResolver = criarExecutivoResolverFake();
    const useCase = new FinalizarCadastroUseCase(agenciaRepository, fileStorage, executivoResolver);

    await useCase.execute(inputFake({ associacaoId: "associacao-1", eventoId: "evento-1" }));

    expect(agenciaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ associacaoId: "associacao-1", eventoId: "evento-1" }),
    );
  });
});
