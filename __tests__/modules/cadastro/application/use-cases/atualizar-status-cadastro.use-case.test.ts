import { AtualizarStatusCadastroUseCase } from "@/modules/cadastro/application/use-cases/atualizar-status-cadastro.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import {
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ATIVACAO,
  type AgenciaDetalhe,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { UsuarioMasterRepository } from "@/modules/cadastro/domain/repositories/usuario-master-repository";
import type { PromotorRepository } from "@/modules/atribuicoes/domain/repositories/promotor-repository";
import type { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { UsuarioMaster } from "@/modules/cadastro/domain/entities/usuario-master.entity";
import type { EmailSender } from "@/modules/shared/domain/services/email-sender";

function agenciaFake(status: string, executivoId: string | null = null): Agencia {
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
    executivoId,
    atualizacaoVistaEm: null,
    atualizacaoVistaPor: null,
    infoPendente: false,
    infoPendenteRemovidoPor: null,
    infoPendenteRemovidoEm: null,
    gateBiometriaAtivo: false,
  });
}

function detalheFake(status: string, executivoId: string | null = null): AgenciaDetalhe {
  return {
    agencia: agenciaFake(status, executivoId),
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

function criarUseCase(
  overrides: {
    agenciaRepository?: Partial<AgenciaRepository>;
    usuarioMasterRepository?: Partial<UsuarioMasterRepository>;
    promotorRepository?: Partial<PromotorRepository>;
  } = {},
) {
  const agenciaRepository = {
    obterDetalhe: jest.fn().mockResolvedValue(detalheFake(STATUS_AGUARDANDO_ATIVACAO)),
    atualizarStatus: jest.fn().mockResolvedValue(agenciaFake(STATUS_ATIVO)),
    ...overrides.agenciaRepository,
  } as unknown as AgenciaRepository;

  const usuarioMasterRepository = {
    findByAgenciaId: jest.fn().mockResolvedValue(null),
    ...overrides.usuarioMasterRepository,
  } as unknown as UsuarioMasterRepository;

  const promotorRepository = {
    findById: jest.fn().mockResolvedValue(null),
    ...overrides.promotorRepository,
  } as unknown as PromotorRepository;

  const emailSender: EmailSender = { send: jest.fn() };

  const useCase = new AtualizarStatusCadastroUseCase(
    agenciaRepository,
    usuarioMasterRepository,
    promotorRepository,
    emailSender,
  );

  return { useCase, agenciaRepository, usuarioMasterRepository, promotorRepository, emailSender };
}

const BASE_INPUT = {
  id: "agencia-1",
  usuarioEmail: "analista@example.com",
  baseUrl: "https://painel.sakuraclick.com.br",
};

describe("AtualizarStatusCadastroUseCase", () => {
  it("lança NotFoundError quando a agência não existe", async () => {
    const { useCase } = criarUseCase({
      agenciaRepository: { obterDetalhe: jest.fn().mockResolvedValue(null) },
    });

    await expect(useCase.execute({ ...BASE_INPUT, status: STATUS_ATIVO })).rejects.toThrow(
      NotFoundError,
    );
  });

  it("não manda e-mail nenhum pra transições que não sejam pra STATUS_ATIVO", async () => {
    const { useCase, emailSender } = criarUseCase();

    await useCase.execute({ ...BASE_INPUT, status: "aguardando_cadastramento" });

    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("manda a Arte 2 (cadastro aprovado) quando o destino é STATUS_ATIVO, com Login=e-mail do Usuário Master", async () => {
    const usuarioMaster = { email: "master@agencia.com" } as unknown as UsuarioMaster;
    const { useCase, emailSender, usuarioMasterRepository } = criarUseCase({
      usuarioMasterRepository: { findByAgenciaId: jest.fn().mockResolvedValue(usuarioMaster) },
    });

    await useCase.execute({ ...BASE_INPUT, status: STATUS_ATIVO });

    expect(usuarioMasterRepository.findByAgenciaId).toHaveBeenCalledWith("agencia-1");
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "master@agencia.com",
        html: expect.stringContaining("master@agencia.com"),
      }),
    );
  });

  it("inclui o executivo quando a agência tem um atribuído", async () => {
    const promotor = {
      nome: "Fulano Executivo",
      telefone: "11999990000",
      email: "exec@sakuratur.com.br",
    } as unknown as Promotor;
    const { useCase, emailSender, promotorRepository } = criarUseCase({
      agenciaRepository: {
        obterDetalhe: jest
          .fn()
          .mockResolvedValue(detalheFake(STATUS_AGUARDANDO_ATIVACAO, "promotor-1")),
      },
      promotorRepository: { findById: jest.fn().mockResolvedValue(promotor) },
    });

    await useCase.execute({ ...BASE_INPUT, status: STATUS_ATIVO });

    expect(promotorRepository.findById).toHaveBeenCalledWith("promotor-1");
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ html: expect.stringContaining("Fulano Executivo") }),
    );
  });

  it("cai pro e-mail de contato da agência quando não existe Usuário Master ainda", async () => {
    const { useCase, emailSender } = criarUseCase();

    await useCase.execute({ ...BASE_INPUT, status: STATUS_ATIVO });

    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "operacional@example.com" }),
    );
  });

  it("não lança se o envio do e-mail (ou a busca de dependências) falhar — ativação não pode ficar refém disso", async () => {
    const { useCase } = criarUseCase({
      usuarioMasterRepository: {
        findByAgenciaId: jest.fn().mockRejectedValue(new Error("db fora do ar")),
      },
    });

    await expect(useCase.execute({ ...BASE_INPUT, status: STATUS_ATIVO })).resolves.toBeDefined();
  });
});
