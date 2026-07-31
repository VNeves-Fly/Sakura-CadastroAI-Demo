import { SincronizarContratoD4SignUseCase } from "@/modules/cadastro/application/use-cases/sincronizar-contrato-d4sign.use-case";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";
import type { ContratoSignatarioRepository } from "@/modules/cadastro/domain/repositories/contrato-signatario-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import type {
  ContratoAssinaturaService,
  DestinatarioD4Sign,
} from "@/modules/cadastro/domain/services/contrato-assinatura-service";

const SOCIO_1 = "socio1@agencia.com";
const SOCIO_2 = "socio2@agencia.com";

function fakeAgenciaRepository(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findByCnpj: jest.fn(),
    findById: jest.fn(),
    findByContratoProvedorId: jest.fn(),
    obterDetalhe: jest.fn(),
    create: jest.fn(),
    atualizarStatus: jest.fn(),
    criarContrato: jest.fn(),
    atualizarStatusContrato: jest.fn(),
    listar: jest.fn(),
    obterKpis: jest.fn(),
    obterAnaliseContratos: jest.fn(),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function fakeContratoAssinaturaService(
  overrides: Partial<ContratoAssinaturaService> = {},
): ContratoAssinaturaService {
  return {
    gerarEEnviar: jest.fn(),
    visualizarDocumento: jest.fn(),
    obterDocumento: jest
      .fn()
      .mockResolvedValue({ existe: true, nomeDocumento: "Contrato", statusName: "Aguardando" }),
    obterDestinatarios: jest.fn().mockResolvedValue([]),
    registrarWebhook: jest.fn().mockResolvedValue({ registrado: true }),
    ...overrides,
  };
}

function fakeContratoSignatarioRepository(
  socios: Array<{ email: string }> = [],
): ContratoSignatarioRepository {
  return {
    findById: jest.fn(),
    findByContratoId: jest.fn().mockResolvedValue(socios),
    create: jest.fn(),
  } as unknown as ContratoSignatarioRepository;
}

function fakeSignatarioPadraoRepository(
  signatarios: SignatarioPadrao[] = [],
): SignatarioPadraoRepository {
  return {
    findAll: async () => signatarios,
    findAtivos: async () => signatarios,
    findById: async () => {
      throw new Error("não implementado");
    },
    create: async () => {
      throw new Error("não implementado");
    },
    update: async () => {
      throw new Error("não implementado");
    },
    softDelete: async () => {
      throw new Error("não implementado");
    },
    restaurar: async () => {
      throw new Error("não implementado");
    },
  };
}

function fakeContratoAssinaturaRepository(
  assinaturas: Array<{ email: string }> = [],
): ContratoAssinaturaRepository {
  return {
    registrar: jest.fn(),
    findByContratoId: jest.fn().mockResolvedValue(assinaturas),
  } as unknown as ContratoAssinaturaRepository;
}

function destinatario(email: string, assinado: boolean | null = null): DestinatarioD4Sign {
  return { email, assinado, assinadoEm: null };
}

const AGENCIA_DETALHE_BASE = {
  agencia: { status: STATUS_AGUARDANDO_ASSINATURA },
  contratos: [{ id: "ct-1", provedorId: "doc-1", status: STATUS_AGUARDANDO_ASSINATURA }],
};

describe("SincronizarContratoD4SignUseCase", () => {
  it("retorna ok:false se a agência não existe", async () => {
    const useCase = new SincronizarContratoD4SignUseCase(
      fakeAgenciaRepository({ obterDetalhe: jest.fn().mockResolvedValue(null) }),
      fakeContratoAssinaturaService(),
      fakeContratoSignatarioRepository(),
      fakeSignatarioPadraoRepository(),
      fakeContratoAssinaturaRepository(),
    );

    const resultado = await useCase.execute("ag-1");

    expect(resultado).toEqual({ ok: false, motivo: expect.stringContaining("não encontrada") });
  });

  it("retorna ok:false se não há contrato pra essa agência", async () => {
    const useCase = new SincronizarContratoD4SignUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest
          .fn()
          .mockResolvedValue({ agencia: { status: STATUS_AGUARDANDO_ASSINATURA }, contratos: [] }),
      }),
      fakeContratoAssinaturaService(),
      fakeContratoSignatarioRepository(),
      fakeSignatarioPadraoRepository(),
      fakeContratoAssinaturaRepository(),
    );

    const resultado = await useCase.execute("ag-1");

    expect(resultado).toEqual({ ok: false, motivo: expect.stringContaining("Nenhum contrato") });
  });

  it("retorna ok:false se o documento não existe no D4Sign", async () => {
    const useCase = new SincronizarContratoD4SignUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue(AGENCIA_DETALHE_BASE),
      }),
      fakeContratoAssinaturaService({
        obterDocumento: jest
          .fn()
          .mockResolvedValue({ existe: false, nomeDocumento: null, statusName: null }),
      }),
      fakeContratoSignatarioRepository([{ email: SOCIO_1 }]),
      fakeSignatarioPadraoRepository(),
      fakeContratoAssinaturaRepository(),
    );

    const resultado = await useCase.execute("ag-1");

    expect(resultado).toEqual({
      ok: false,
      motivo: expect.stringContaining("Documento não encontrado"),
    });
  });

  it("retorna ok:false (sem alterar nada) quando o D4Sign lança erro ao buscar destinatários — não vira 500", async () => {
    const agenciaRepository = fakeAgenciaRepository({
      obterDetalhe: jest.fn().mockResolvedValue(AGENCIA_DETALHE_BASE),
    });
    const useCase = new SincronizarContratoD4SignUseCase(
      agenciaRepository,
      fakeContratoAssinaturaService({
        obterDestinatarios: jest
          .fn()
          .mockRejectedValue(
            new Error("D4Sign /documents/doc-1/list devolveu erro: Chave de API inválida."),
          ),
      }),
      fakeContratoSignatarioRepository([{ email: SOCIO_1 }]),
      fakeSignatarioPadraoRepository(),
      fakeContratoAssinaturaRepository(),
    );

    const resultado = await useCase.execute("ag-1");

    expect(resultado).toEqual({
      ok: false,
      motivo: expect.stringContaining("Chave de API inválida"),
    });
    expect(agenciaRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it("retorna ok:false (sem tratar como remoção em massa) quando o D4Sign devolve lista vazia mas havia destinatários esperados", async () => {
    const agenciaRepository = fakeAgenciaRepository({
      obterDetalhe: jest.fn().mockResolvedValue(AGENCIA_DETALHE_BASE),
    });
    const useCase = new SincronizarContratoD4SignUseCase(
      agenciaRepository,
      fakeContratoAssinaturaService({ obterDestinatarios: jest.fn().mockResolvedValue([]) }),
      fakeContratoSignatarioRepository([{ email: SOCIO_1 }]),
      fakeSignatarioPadraoRepository([]),
      fakeContratoAssinaturaRepository(),
    );

    const resultado = await useCase.execute("ag-1");

    expect(resultado).toEqual({
      ok: false,
      motivo: expect.stringContaining("não retornou nenhum destinatário"),
    });
    expect(agenciaRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it("calcula adicionados/removidos corretamente quando a lista do D4Sign bate parcialmente com o esperado", async () => {
    const agenciaRepository = fakeAgenciaRepository({
      obterDetalhe: jest.fn().mockResolvedValue(AGENCIA_DETALHE_BASE),
    });
    const useCase = new SincronizarContratoD4SignUseCase(
      agenciaRepository,
      fakeContratoAssinaturaService({
        obterDestinatarios: jest
          .fn()
          .mockResolvedValue([destinatario(SOCIO_1), destinatario("novo@agencia.com")]),
      }),
      fakeContratoSignatarioRepository([{ email: SOCIO_1 }, { email: SOCIO_2 }]),
      fakeSignatarioPadraoRepository([]),
      fakeContratoAssinaturaRepository(),
    );

    const resultado = await useCase.execute("ag-1");

    expect(resultado).toEqual({
      ok: true,
      statusDocumento: "Aguardando",
      adicionados: ["novo@agencia.com"],
      removidos: [SOCIO_2],
      assinaturasAtualizadas: 0,
      avancouStatus: false,
    });
  });

  it("backfilla assinaturas reportadas como assinadas e avança o status quando todos os sócios já assinaram", async () => {
    const agenciaRepository = fakeAgenciaRepository({
      obterDetalhe: jest.fn().mockResolvedValue(AGENCIA_DETALHE_BASE),
    });
    const contratoAssinaturaRepository = fakeContratoAssinaturaRepository([]);
    const useCase = new SincronizarContratoD4SignUseCase(
      agenciaRepository,
      fakeContratoAssinaturaService({
        obterDestinatarios: jest
          .fn()
          .mockResolvedValue([destinatario(SOCIO_1, true), destinatario(SOCIO_2, true)]),
      }),
      fakeContratoSignatarioRepository([{ email: SOCIO_1 }, { email: SOCIO_2 }]),
      fakeSignatarioPadraoRepository([]),
      contratoAssinaturaRepository,
    );

    const resultado = await useCase.execute("ag-1");

    expect(contratoAssinaturaRepository.registrar).toHaveBeenCalledWith("ct-1", SOCIO_1);
    expect(contratoAssinaturaRepository.registrar).toHaveBeenCalledWith("ct-1", SOCIO_2);
    expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith(
      "ag-1",
      STATUS_AGUARDANDO_VALIDACAO,
    );
    expect(resultado).toEqual({
      ok: true,
      statusDocumento: "Aguardando",
      adicionados: [],
      removidos: [],
      assinaturasAtualizadas: 2,
      avancouStatus: true,
    });
  });
});
