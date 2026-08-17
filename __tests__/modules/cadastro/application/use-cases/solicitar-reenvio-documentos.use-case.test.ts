import { SolicitarReenvioDocumentosUseCase } from "@/modules/cadastro/application/use-cases/solicitar-reenvio-documentos.use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type {
  AgenciaDetalhe,
  AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import { Documento } from "@/modules/cadastro/domain/entities/documento.entity";

const BASE_URL = "https://painel.sakuraclick.com.br";

function agenciaFake(): Agencia {
  return Agencia.create({
    id: "agencia-1",
    razaoSocial: "Empresa Teste Ltda",
    nomeFantasia: null,
    cnpj: "12345678000195",
    etapaAtual: 1,
    status: "em_complementar",
    contratoSocialPath: "agencias/12345678000195/contrato-social.pdf",
    emailContato: "cliente@example.com",
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
  });
}

function documentoFake(): Documento {
  return Documento.create({
    id: "doc-contrato-1",
    agenciaId: "agencia-1",
    representanteLegalId: null,
    tipo: "CONTRATO_SOCIAL",
    fileName: null,
    descricaoOutro: null,
    mimeType: null,
    gcsPath: "agencias/12345678000195/contrato-social.pdf",
    gcsBucket: "bucket",
    gcsSize: null,
    gcsMd5: null,
    status: "REPROVADO",
    verificado: false,
    reprovadoPor: "analista@example.com",
    motivoReprovacao: "Documento ilegível.",
    reprovadoEm: new Date("2026-01-02"),
    aprovadoPor: null,
    motivoAprovacao: null,
    aprovadoEm: null,
    inseridoManualmentePor: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
  });
}

function detalheFake(): AgenciaDetalhe {
  return {
    agencia: agenciaFake(),
    complementar: null,
    representantesLegais: [],
    contratoSocial: documentoFake(),
    contratos: [],
    analiseIa: null,
    historicoConsultaCredito: [],
    consultasSst: [],
    executivoNome: null,
    associacaoNome: null,
    eventoNome: null,
  };
}

function criarAgenciaRepositoryFake(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    obterDetalhe: jest.fn().mockResolvedValue(detalheFake()),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function criarEmailSenderFake(overrides: Partial<EmailSender> = {}): EmailSender {
  return {
    send: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("SolicitarReenvioDocumentosUseCase", () => {
  it("lança DomainError quando nenhum documentoId é informado", async () => {
    const useCase = new SolicitarReenvioDocumentosUseCase(
      criarAgenciaRepositoryFake(),
      criarEmailSenderFake(),
    );

    await expect(
      useCase.execute({ agenciaId: "agencia-1", documentoIds: [], baseUrl: BASE_URL }),
    ).rejects.toThrow(DomainError);
  });

  it("lança NotFoundError quando a agência não existe", async () => {
    const useCase = new SolicitarReenvioDocumentosUseCase(
      criarAgenciaRepositoryFake({ obterDetalhe: jest.fn().mockResolvedValue(null) }),
      criarEmailSenderFake(),
    );

    await expect(
      useCase.execute({
        agenciaId: "agencia-1",
        documentoIds: ["doc-contrato-1"],
        baseUrl: BASE_URL,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("envia o e-mail com o link de reenvio quando tudo dá certo", async () => {
    const emailSender = criarEmailSenderFake();
    const useCase = new SolicitarReenvioDocumentosUseCase(
      criarAgenciaRepositoryFake(),
      emailSender,
    );

    await useCase.execute({
      agenciaId: "agencia-1",
      documentoIds: ["doc-contrato-1"],
      baseUrl: BASE_URL,
    });

    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "cliente@example.com",
        html: expect.stringContaining("/cadastro/documentos-pendentes/agencia-1"),
      }),
    );
  });

  // Bug real reportado em produção: SMTP fora do ar (ou qualquer outra
  // falha de envio) derrubava a página inteira com um "server-side
  // exception" ao solicitar reenvio de documento reprovado — o e-mail é
  // só best-effort (o link já fica disponível no dossiê de qualquer
  // forma), então uma falha de envio nunca pode propagar.
  it("não lança quando o envio de e-mail falha (best-effort)", async () => {
    const emailSender = criarEmailSenderFake({
      send: jest.fn().mockRejectedValue(new Error("SMTP indisponível")),
    });
    const useCase = new SolicitarReenvioDocumentosUseCase(
      criarAgenciaRepositoryFake(),
      emailSender,
    );

    await expect(
      useCase.execute({
        agenciaId: "agencia-1",
        documentoIds: ["doc-contrato-1"],
        baseUrl: BASE_URL,
      }),
    ).resolves.toBeUndefined();
  });
});
