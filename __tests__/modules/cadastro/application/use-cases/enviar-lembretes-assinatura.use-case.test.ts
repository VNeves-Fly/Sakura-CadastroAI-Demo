import { EnviarLembretesAssinaturaUseCase } from "@/modules/cadastro/application/use-cases/enviar-lembretes-assinatura.use-case";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import { BiometriaVerificacao } from "@/modules/cadastro/domain/entities/biometria-verificacao.entity";
import type {
  AgenciaRepository,
  AgenciaDetalhe,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import type { IniciarVerificacaoBiometricaUseCase } from "@/modules/cadastro/application/use-cases/iniciar-verificacao-biometrica.use-case";
import type { ObterLinkAssinaturaUseCase } from "@/modules/cadastro/application/use-cases/obter-link-assinatura.use-case";

function agenciaFake(id: string, gateBiometriaAtivo: boolean): Agencia {
  return Agencia.create({
    id,
    razaoSocial: "Empresa Teste Ltda",
    nomeFantasia: null,
    cnpj: "12345678000195",
    etapaAtual: 1,
    status: "aguardando_assinatura",
    contratoSocialPath: "path",
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
    infoPendenteRemovidoPor: null,
    infoPendenteRemovidoEm: null,
    gateBiometriaAtivo,
  });
}

function detalheFake(overrides: Partial<AgenciaDetalhe> = {}): AgenciaDetalhe {
  return {
    agencia: agenciaFake("ag-1", true),
    complementar: null,
    representantesLegais: [
      {
        id: "socio-1",
        nome: "Fulano de Tal",
        cpf: "39053344705",
        email: "fulano@teste.com",
        telefone: "11999998888",
        estadoCivil: "solteiro",
        isRepresentanteLegal: false,
        endereco: {
          cep: "",
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          uf: "",
        },
        rg: null,
        procuracao: null,
        rgNumero: null,
        rgOrgaoEmissor: null,
        nacionalidade: null,
        dataNascimento: null,
        administrativo: null,
      },
    ],
    contratoSocial: null,
    contratos: [
      {
        id: "ct-1",
        provedorId: "d4sign-1",
        status: "aguardando_assinatura",
        origemGeracao: "ia",
        createdAt: new Date(),
      },
    ],
    analiseIa: null,
    historicoConsultaCredito: [],
    consultasSst: [],
    executivoNome: null,
    associacaoNome: null,
    eventoNome: null,
    ...overrides,
  };
}

function verificacaoFake(status: "pendente" | "aprovado" | "reprovado" | "analise_manual") {
  return BiometriaVerificacao.create({
    id: "biometria-1",
    contratoId: "ct-1",
    agenciaId: "ag-1",
    email: "fulano@teste.com",
    cpf: "39053344705",
    token: "token-1",
    status,
    sessionId: "s",
    personId: "p",
    legitimuzUrl: "https://widget.legitimuz.com/token-1",
    legitimuzUrlQrCode: "https://widget.legitimuz.com/token-1/qr-code",
    tentativasLembrete: 0,
    linkEnviadoEm: new Date(),
    resolvidoEm: null,
    expiraEm: new Date("2099-01-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("EnviarLembretesAssinaturaUseCase", () => {
  function montarUseCase(
    overrides: {
      agenciaRepository?: Partial<AgenciaRepository>;
      biometriaVerificacaoRepository?: Partial<BiometriaVerificacaoRepository>;
      contratoAssinaturaRepository?: Partial<ContratoAssinaturaRepository>;
    } = {},
  ) {
    const agenciaRepository = {
      listar: jest.fn().mockResolvedValue({
        items: [{ agencia: agenciaFake("ag-1", true) }],
        total: 1,
      }),
      obterDetalhe: jest.fn().mockResolvedValue(detalheFake()),
      ...overrides.agenciaRepository,
    } as unknown as AgenciaRepository;

    const biometriaVerificacaoRepository = {
      buscarPorContratoIdEEmail: jest.fn().mockResolvedValue(null),
      incrementarTentativasLembrete: jest.fn(),
      ...overrides.biometriaVerificacaoRepository,
    } as unknown as BiometriaVerificacaoRepository;

    const contratoAssinaturaRepository = {
      findByContratoId: jest.fn().mockResolvedValue([]),
      ...overrides.contratoAssinaturaRepository,
    } as unknown as ContratoAssinaturaRepository;

    const iniciarVerificacaoBiometricaUseCase = {
      execute: jest.fn(),
    } as unknown as IniciarVerificacaoBiometricaUseCase;

    const obterLinkAssinaturaUseCase = {
      execute: jest.fn().mockResolvedValue({ ok: true, link: "https://secure.d4sign.com.br/x" }),
    } as unknown as ObterLinkAssinaturaUseCase;

    const emailSender: EmailSender = { send: jest.fn() };

    const useCase = new EnviarLembretesAssinaturaUseCase(
      agenciaRepository,
      biometriaVerificacaoRepository,
      contratoAssinaturaRepository,
      iniciarVerificacaoBiometricaUseCase,
      obterLinkAssinaturaUseCase,
      emailSender,
    );

    return {
      useCase,
      agenciaRepository,
      biometriaVerificacaoRepository,
      contratoAssinaturaRepository,
      iniciarVerificacaoBiometricaUseCase,
      obterLinkAssinaturaUseCase,
      emailSender,
    };
  }

  it("ignora agências sem gateBiometriaAtivo", async () => {
    const { useCase, agenciaRepository, iniciarVerificacaoBiometricaUseCase } = montarUseCase({
      agenciaRepository: {
        listar: jest
          .fn()
          .mockResolvedValue({ items: [{ agencia: agenciaFake("ag-1", false) }], total: 1 }),
      },
    });

    const resultado = await useCase.execute({ baseUrl: "https://example.com" });

    expect(agenciaRepository.obterDetalhe).not.toHaveBeenCalled();
    expect(iniciarVerificacaoBiometricaUseCase.execute).not.toHaveBeenCalled();
    expect(resultado).toEqual({ lembretesBiometriaEnviados: 0, lembretesAssinaturaEnviados: 0 });
  });

  it("reenvia lembrete de biometria pra sócio sem verificação aprovada ainda", async () => {
    const { useCase, iniciarVerificacaoBiometricaUseCase } = montarUseCase({
      biometriaVerificacaoRepository: {
        buscarPorContratoIdEEmail: jest.fn().mockResolvedValue(verificacaoFake("pendente")),
      },
    });

    const resultado = await useCase.execute({ baseUrl: "https://example.com" });

    expect(iniciarVerificacaoBiometricaUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ contratoId: "ct-1", agenciaId: "ag-1", email: "fulano@teste.com" }),
    );
    expect(resultado.lembretesBiometriaEnviados).toBe(1);
    expect(resultado.lembretesAssinaturaEnviados).toBe(0);
  });

  it("reenvia lembrete de ASSINATURA (não biometria) quando já aprovado mas ainda não assinou", async () => {
    const {
      useCase,
      obterLinkAssinaturaUseCase,
      emailSender,
      iniciarVerificacaoBiometricaUseCase,
    } = montarUseCase({
      biometriaVerificacaoRepository: {
        buscarPorContratoIdEEmail: jest.fn().mockResolvedValue(verificacaoFake("aprovado")),
      },
    });

    const resultado = await useCase.execute({ baseUrl: "https://example.com" });

    expect(iniciarVerificacaoBiometricaUseCase.execute).not.toHaveBeenCalled();
    expect(obterLinkAssinaturaUseCase.execute).toHaveBeenCalledWith({
      agenciaId: "ag-1",
      email: "fulano@teste.com",
    });
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "fulano@teste.com" }),
    );
    expect(resultado.lembretesAssinaturaEnviados).toBe(1);
  });

  it("não lembra ninguém que já assinou de verdade", async () => {
    const { useCase, iniciarVerificacaoBiometricaUseCase, obterLinkAssinaturaUseCase } =
      montarUseCase({
        contratoAssinaturaRepository: {
          findByContratoId: jest
            .fn()
            .mockResolvedValue([{ email: "fulano@teste.com", assinadoEm: new Date() }]),
        },
      });

    const resultado = await useCase.execute({ baseUrl: "https://example.com" });

    expect(iniciarVerificacaoBiometricaUseCase.execute).not.toHaveBeenCalled();
    expect(obterLinkAssinaturaUseCase.execute).not.toHaveBeenCalled();
    expect(resultado).toEqual({ lembretesBiometriaEnviados: 0, lembretesAssinaturaEnviados: 0 });
  });
});
