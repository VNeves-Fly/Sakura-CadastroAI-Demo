import { RecusarCadastroUseCase } from "@/modules/cadastro/application/use-cases/recusar-cadastro.use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import {
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
  type AgenciaDetalhe,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { HistoricoEdicaoCadastroRepository } from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";

function agenciaFake(status: string): Agencia {
  return Agencia.create({
    id: "agencia-1",
    razaoSocial: "Empresa Teste Ltda",
    nomeFantasia: null,
    cnpj: "12345678000195",
    etapaAtual: 1,
    status,
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
    gateBiometriaAtivo: false,
  });
}

function detalheFake(): AgenciaDetalhe {
  return {
    agencia: agenciaFake(STATUS_EM_COMPLEMENTAR),
    complementar: null,
    representantesLegais: [],
    contratoSocial: null,
    contratos: [],
    analiseIa: null,
    historicoConsultaCredito: [],
    consultasSst: [],
    executivoNome: null,
    associacaoNome: null,
    eventoNome: null,
  };
}

function criarUseCase(overrides: { agenciaRepository?: Partial<AgenciaRepository> } = {}) {
  const agenciaRepository = {
    obterDetalhe: jest.fn().mockResolvedValue(detalheFake()),
    atualizarStatus: jest.fn().mockResolvedValue(agenciaFake(STATUS_RECUSADO)),
    ...overrides.agenciaRepository,
  } as unknown as AgenciaRepository;

  const historicoEdicaoCadastroRepository = {
    create: jest.fn(),
  } as unknown as HistoricoEdicaoCadastroRepository;

  const emailSender: EmailSender = { send: jest.fn() };

  const useCase = new RecusarCadastroUseCase(
    agenciaRepository,
    historicoEdicaoCadastroRepository,
    emailSender,
  );

  return { useCase, agenciaRepository, historicoEdicaoCadastroRepository, emailSender };
}

const INPUT = {
  agenciaId: "agencia-1",
  motivo: "CNPJ com pendência na Receita",
  recusadoPor: "analista@example.com",
  baseUrl: "https://painel.sakuraclick.com.br",
};

describe("RecusarCadastroUseCase", () => {
  it("lança NotFoundError quando a agência não existe", async () => {
    const { useCase } = criarUseCase({
      agenciaRepository: { obterDetalhe: jest.fn().mockResolvedValue(null) },
    });

    await expect(useCase.execute(INPUT)).rejects.toThrow(NotFoundError);
  });

  it("lança DomainError quando o motivo está vazio", async () => {
    const { useCase } = criarUseCase();

    await expect(useCase.execute({ ...INPUT, motivo: "   " })).rejects.toThrow(DomainError);
  });

  it("atualiza o status, grava histórico e manda a Arte 4 pro e-mail de contato", async () => {
    const { useCase, agenciaRepository, historicoEdicaoCadastroRepository, emailSender } =
      criarUseCase();

    const resultado = await useCase.execute(INPUT);

    expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith("agencia-1", STATUS_RECUSADO, {
      usuarioEmail: "analista@example.com",
      origem: "usuario",
      observacao: "CNPJ com pendência na Receita",
    });
    expect(historicoEdicaoCadastroRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        agenciaId: "agencia-1",
        justificativa: "CNPJ com pendência na Receita",
      }),
    );
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "operacional@example.com" }),
    );
    expect(resultado.status).toBe(STATUS_RECUSADO);
  });

  it("não lança se o envio do e-mail falhar", async () => {
    const { agenciaRepository, historicoEdicaoCadastroRepository } = criarUseCase();
    const emailSenderComFalha: EmailSender = {
      send: jest.fn().mockRejectedValue(new Error("SMTP fora do ar")),
    };
    const useCase = new RecusarCadastroUseCase(
      agenciaRepository,
      historicoEdicaoCadastroRepository,
      emailSenderComFalha,
    );

    await expect(useCase.execute(INPUT)).resolves.toBeDefined();
  });
});
