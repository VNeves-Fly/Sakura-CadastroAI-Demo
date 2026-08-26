import { SincronizarContratoD4SignUseCase } from "@/modules/cadastro/application/use-cases/sincronizar-contrato-d4sign.use-case";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_CADASTRAMENTO,
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
import type { BiometriaVerificacaoRepository } from "@/modules/cadastro/domain/repositories/biometria-verificacao-repository";

const SOCIO_1 = "socio1@agencia.com";
const SOCIO_2 = "socio2@agencia.com";

const JEAN = SignatarioPadrao.create({
  id: "sig-jean",
  nome: "Jean",
  cargo: "Time Cadastro",
  email: "cadastro@sakuratur.com.br",
  telefone: null,
  deletedAt: null,
  ordem: 1,
  papel: "APROVAR",
  estagio: 1,
});

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
    cancelarDocumento: jest.fn(),
    obterLinkAssinatura: jest.fn(),
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
    reordenar: async () => {
      throw new Error("não implementado");
    },
  };
}

// Stateful (não só um jest.fn() estático): registrar/registrarDestinatario/
// marcarRemocaoDoDocumento mutam o mesmo Map que findByContratoId lê depois
// — necessário porque tentarAvancarAposAssinaturaEBiometria (chamado no
// meio de SincronizarContratoD4SignUseCase.execute) reconsulta o
// repositório DEPOIS do loop de backfill, então precisa enxergar o que
// acabou de ser escrito na mesma execução (mesma garantia que o Prisma
// real dá — read-after-write).
function fakeContratoAssinaturaRepository(
  assinaturasIniciais: Array<{
    email: string;
    assinadoEm?: Date | null;
    removidoDoDocumentoEm?: Date | null;
    keySigner?: string | null;
  }> = [],
): ContratoAssinaturaRepository {
  const estado = new Map(
    assinaturasIniciais.map((a) => [
      a.email,
      { assinadoEm: null, removidoDoDocumentoEm: null, keySigner: null, ...a },
    ]),
  );

  return {
    registrar: jest.fn(
      async (_contratoId: string, email: string, keySigner: string | null = null) => {
        const atual = estado.get(email) ?? {
          email,
          assinadoEm: null,
          removidoDoDocumentoEm: null,
          keySigner: null,
        };
        estado.set(email, {
          ...atual,
          assinadoEm: new Date(),
          keySigner: keySigner ?? atual.keySigner,
        });
      },
    ),
    registrarDestinatario: jest.fn(
      async (_contratoId: string, email: string, keySigner: string | null = null) => {
        const atual = estado.get(email) ?? {
          email,
          assinadoEm: null,
          removidoDoDocumentoEm: null,
          keySigner: null,
        };
        estado.set(email, { ...atual, keySigner: keySigner ?? atual.keySigner });
      },
    ),
    marcarRemocaoDoDocumento: jest.fn(
      async (_contratoId: string, email: string, removido: boolean) => {
        const atual = estado.get(email);
        if (atual)
          estado.set(email, { ...atual, removidoDoDocumentoEm: removido ? new Date() : null });
      },
    ),
    findByContratoId: jest.fn(async () => Array.from(estado.values())),
  } as unknown as ContratoAssinaturaRepository;
}

function destinatario(
  email: string,
  assinado: boolean | null = null,
  keySigner: string | null = null,
): DestinatarioD4Sign {
  return { email, assinado, assinadoEm: null, keySigner };
}

// Só relevante quando a agência tem gateBiometriaAtivo — nos testes sem
// gate (AGENCIA_DETALHE_BASE não define esse campo, então fica falsy),
// tentarAvancarAposAssinaturaEBiometria nem chega a consultar isso.
function fakeBiometriaVerificacaoRepository(
  biometrias: Array<{ email: string; status: string }> = [],
): BiometriaVerificacaoRepository {
  return {
    criarOuSubstituir: jest.fn(),
    buscarPorToken: jest.fn(),
    buscarPorContratoIdEEmail: jest.fn(),
    findByContratoId: jest.fn().mockResolvedValue(biometrias),
    atualizarStatus: jest.fn(),
    incrementarTentativasLembrete: jest.fn(),
  } as unknown as BiometriaVerificacaoRepository;
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
      fakeBiometriaVerificacaoRepository(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      sincronizadoPor: "analista@x.com",
    });

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
      fakeBiometriaVerificacaoRepository(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      sincronizadoPor: "analista@x.com",
    });

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
      fakeBiometriaVerificacaoRepository(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      sincronizadoPor: "analista@x.com",
    });

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
      fakeBiometriaVerificacaoRepository(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      sincronizadoPor: "analista@x.com",
    });

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
      fakeBiometriaVerificacaoRepository(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      sincronizadoPor: "analista@x.com",
    });

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
      fakeBiometriaVerificacaoRepository(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      sincronizadoPor: "analista@x.com",
    });

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
      fakeBiometriaVerificacaoRepository(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      sincronizadoPor: "analista@x.com",
    });

    expect(contratoAssinaturaRepository.registrar).toHaveBeenCalledWith("ct-1", SOCIO_1, null);
    expect(contratoAssinaturaRepository.registrar).toHaveBeenCalledWith("ct-1", SOCIO_2, null);
    expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith(
      "ag-1",
      STATUS_AGUARDANDO_VALIDACAO,
      { usuarioEmail: "analista@x.com", origem: "usuario" },
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

  describe("gate de biometria ativo (2026-08-25)", () => {
    const AGENCIA_DETALHE_GATE_ATIVO = {
      agencia: { status: STATUS_AGUARDANDO_ASSINATURA, gateBiometriaAtivo: true },
      contratos: [{ id: "ct-1", provedorId: "doc-1", status: STATUS_AGUARDANDO_ASSINATURA }],
    };

    it("NÃO avança (nem pra aguardando_validacao) quando todos assinaram mas falta biometria de algum sócio", async () => {
      const agenciaRepository = fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue(AGENCIA_DETALHE_GATE_ATIVO),
      });
      const useCase = new SincronizarContratoD4SignUseCase(
        agenciaRepository,
        fakeContratoAssinaturaService({
          obterDestinatarios: jest
            .fn()
            .mockResolvedValue([destinatario(SOCIO_1, true), destinatario(SOCIO_2, true)]),
        }),
        fakeContratoSignatarioRepository([{ email: SOCIO_1 }, { email: SOCIO_2 }]),
        fakeSignatarioPadraoRepository([]),
        fakeContratoAssinaturaRepository([]),
        fakeBiometriaVerificacaoRepository([{ email: SOCIO_1, status: "aprovado" }]),
      );

      const resultado = await useCase.execute({
        agenciaId: "ag-1",
        sincronizadoPor: "analista@x.com",
      });

      expect(agenciaRepository.atualizarStatus).not.toHaveBeenCalled();
      expect(resultado.ok && resultado.avancouStatus).toBe(false);
    });

    it("avança direto pra aguardando_cadastramento (pula aguardando_validacao) quando todos assinaram E têm biometria aprovada", async () => {
      const agenciaRepository = fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue(AGENCIA_DETALHE_GATE_ATIVO),
      });
      const useCase = new SincronizarContratoD4SignUseCase(
        agenciaRepository,
        fakeContratoAssinaturaService({
          obterDestinatarios: jest
            .fn()
            .mockResolvedValue([destinatario(SOCIO_1, true), destinatario(SOCIO_2, true)]),
        }),
        fakeContratoSignatarioRepository([{ email: SOCIO_1 }, { email: SOCIO_2 }]),
        fakeSignatarioPadraoRepository([]),
        fakeContratoAssinaturaRepository([]),
        fakeBiometriaVerificacaoRepository([
          { email: SOCIO_1, status: "aprovado" },
          { email: SOCIO_2, status: "aprovado" },
        ]),
      );

      const resultado = await useCase.execute({
        agenciaId: "ag-1",
        sincronizadoPor: "analista@x.com",
      });

      expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith(
        "ag-1",
        STATUS_AGUARDANDO_CADASTRAMENTO,
        { usuarioEmail: "analista@x.com", origem: "usuario" },
      );
      expect(resultado.ok && resultado.avancouStatus).toBe(true);
    });
  });

  it("registra destinatário sem assinatura (só o keySigner) quando alguém ainda não assinou", async () => {
    const contratoAssinaturaRepository = fakeContratoAssinaturaRepository([]);
    const useCase = new SincronizarContratoD4SignUseCase(
      fakeAgenciaRepository({ obterDetalhe: jest.fn().mockResolvedValue(AGENCIA_DETALHE_BASE) }),
      fakeContratoAssinaturaService({
        obterDestinatarios: jest.fn().mockResolvedValue([destinatario(SOCIO_1, false, "key-abc")]),
      }),
      fakeContratoSignatarioRepository([{ email: SOCIO_1 }]),
      fakeSignatarioPadraoRepository([]),
      contratoAssinaturaRepository,
      fakeBiometriaVerificacaoRepository(),
    );

    await useCase.execute({ agenciaId: "ag-1", sincronizadoPor: "analista@x.com" });

    expect(contratoAssinaturaRepository.registrarDestinatario).toHaveBeenCalledWith(
      "ct-1",
      SOCIO_1,
      "key-abc",
    );
    expect(contratoAssinaturaRepository.registrar).not.toHaveBeenCalled();
  });

  it("avança aguardando_validacao para aguardando_cadastramento quando o aprovador assinou (via sync)", async () => {
    const agenciaRepository = fakeAgenciaRepository({
      obterDetalhe: jest.fn().mockResolvedValue({
        agencia: { status: STATUS_AGUARDANDO_VALIDACAO },
        contratos: [{ id: "ct-1", provedorId: "doc-1", status: STATUS_AGUARDANDO_VALIDACAO }],
      }),
    });
    const useCase = new SincronizarContratoD4SignUseCase(
      agenciaRepository,
      fakeContratoAssinaturaService({
        obterDestinatarios: jest
          .fn()
          .mockResolvedValue([
            destinatario(SOCIO_1, true),
            destinatario("cadastro@sakuratur.com.br", true),
          ]),
      }),
      fakeContratoSignatarioRepository([{ email: SOCIO_1 }]),
      fakeSignatarioPadraoRepository([JEAN]),
      fakeContratoAssinaturaRepository([{ email: SOCIO_1, assinadoEm: new Date() }]),
      fakeBiometriaVerificacaoRepository(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      sincronizadoPor: "analista@x.com",
    });

    expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith(
      "ag-1",
      STATUS_AGUARDANDO_CADASTRAMENTO,
      { usuarioEmail: "analista@x.com", origem: "usuario" },
    );
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.avancouStatus).toBe(true);
  });

  it("não avança de aguardando_validacao se o aprovador ainda não assinou (nem antes, nem agora)", async () => {
    const agenciaRepository = fakeAgenciaRepository({
      obterDetalhe: jest.fn().mockResolvedValue({
        agencia: { status: STATUS_AGUARDANDO_VALIDACAO },
        contratos: [{ id: "ct-1", provedorId: "doc-1", status: STATUS_AGUARDANDO_VALIDACAO }],
      }),
    });
    const useCase = new SincronizarContratoD4SignUseCase(
      agenciaRepository,
      fakeContratoAssinaturaService({
        obterDestinatarios: jest
          .fn()
          .mockResolvedValue([
            destinatario(SOCIO_1, true),
            destinatario("cadastro@sakuratur.com.br", false),
          ]),
      }),
      fakeContratoSignatarioRepository([{ email: SOCIO_1 }]),
      fakeSignatarioPadraoRepository([JEAN]),
      fakeContratoAssinaturaRepository([{ email: SOCIO_1, assinadoEm: new Date() }]),
      fakeBiometriaVerificacaoRepository(),
    );

    const resultado = await useCase.execute({
      agenciaId: "ag-1",
      sincronizadoPor: "analista@x.com",
    });

    expect(agenciaRepository.atualizarStatus).not.toHaveBeenCalled();
    expect(resultado.ok && resultado.avancouStatus).toBe(false);
  });

  it("marca remoção do documento pra quem já tinha assinatura e sumiu da lista do D4Sign", async () => {
    const contratoAssinaturaRepository = fakeContratoAssinaturaRepository([
      { email: SOCIO_1, assinadoEm: new Date() },
      { email: SOCIO_2, assinadoEm: new Date() },
    ]);
    const useCase = new SincronizarContratoD4SignUseCase(
      fakeAgenciaRepository({ obterDetalhe: jest.fn().mockResolvedValue(AGENCIA_DETALHE_BASE) }),
      fakeContratoAssinaturaService({
        // SOCIO_2 sumiu da lista do D4Sign
        obterDestinatarios: jest.fn().mockResolvedValue([destinatario(SOCIO_1, true)]),
      }),
      fakeContratoSignatarioRepository([{ email: SOCIO_1 }, { email: SOCIO_2 }]),
      fakeSignatarioPadraoRepository([]),
      contratoAssinaturaRepository,
      fakeBiometriaVerificacaoRepository(),
    );

    await useCase.execute({ agenciaId: "ag-1", sincronizadoPor: "analista@x.com" });

    expect(contratoAssinaturaRepository.marcarRemocaoDoDocumento).toHaveBeenCalledWith(
      "ct-1",
      SOCIO_2,
      true,
    );
  });

  it("limpa a marca de removido quando o destinatário reaparece na lista do D4Sign", async () => {
    const contratoAssinaturaRepository = fakeContratoAssinaturaRepository([
      { email: SOCIO_1, assinadoEm: new Date(), removidoDoDocumentoEm: new Date() },
    ]);
    const useCase = new SincronizarContratoD4SignUseCase(
      fakeAgenciaRepository({ obterDetalhe: jest.fn().mockResolvedValue(AGENCIA_DETALHE_BASE) }),
      fakeContratoAssinaturaService({
        obterDestinatarios: jest.fn().mockResolvedValue([destinatario(SOCIO_1, true)]),
      }),
      fakeContratoSignatarioRepository([{ email: SOCIO_1 }]),
      fakeSignatarioPadraoRepository([]),
      contratoAssinaturaRepository,
      fakeBiometriaVerificacaoRepository(),
    );

    await useCase.execute({ agenciaId: "ag-1", sincronizadoPor: "analista@x.com" });

    expect(contratoAssinaturaRepository.marcarRemocaoDoDocumento).toHaveBeenCalledWith(
      "ct-1",
      SOCIO_1,
      false,
    );
  });
});
