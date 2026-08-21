import { ObterLinkAssinaturaUseCase } from "@/modules/cadastro/application/use-cases/obter-link-assinatura.use-case";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";
import type { ContratoAssinaturaService } from "@/modules/cadastro/domain/services/contrato-assinatura-service";
import { ContratoAssinatura } from "@/modules/cadastro/domain/entities/contrato-assinatura.entity";

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

function fakeContratoAssinaturaRepository(
  overrides: Partial<ContratoAssinaturaRepository> = {},
): ContratoAssinaturaRepository {
  return {
    registrar: jest.fn(),
    registrarDestinatario: jest.fn(),
    findByContratoId: jest.fn().mockResolvedValue([]),
    marcarRemocaoDoDocumento: jest.fn(),
    findPendentesPorEmail: jest.fn(),
    ...overrides,
  };
}

function fakeContratoAssinaturaService(
  overrides: Partial<ContratoAssinaturaService> = {},
): ContratoAssinaturaService {
  return {
    gerarEEnviar: jest.fn(),
    visualizarDocumento: jest.fn(),
    obterDocumento: jest.fn(),
    obterDestinatarios: jest.fn(),
    registrarWebhook: jest.fn(),
    cancelarDocumento: jest.fn(),
    obterLinkAssinatura: jest.fn(),
    ...overrides,
  };
}

function assinatura(email: string, keySigner: string | null): ContratoAssinatura {
  return ContratoAssinatura.create({
    id: "assinatura-1",
    contratoId: "contrato-1",
    email,
    assinadoEm: null,
    keySigner,
    removidoDoDocumentoEm: null,
  });
}

describe("ObterLinkAssinaturaUseCase", () => {
  it("retorna ok:false se a agência não tem contrato", async () => {
    const useCase = new ObterLinkAssinaturaUseCase(
      fakeAgenciaRepository({ obterDetalhe: jest.fn().mockResolvedValue({ contratos: [] }) }),
      fakeContratoAssinaturaRepository(),
      fakeContratoAssinaturaService(),
    );

    const resultado = await useCase.execute({ agenciaId: "ag-1", email: "socio@agencia.com" });

    expect(resultado).toEqual({
      ok: false,
      motivo: "Nenhum contrato encontrado pra esta agência.",
    });
  });

  it("retorna ok:false se ainda não conhecemos o keySigner desse e-mail", async () => {
    const useCase = new ObterLinkAssinaturaUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest
          .fn()
          .mockResolvedValue({ contratos: [{ id: "contrato-1", provedorId: "uuid-d4sign" }] }),
      }),
      fakeContratoAssinaturaRepository({
        findByContratoId: jest.fn().mockResolvedValue([]),
      }),
      fakeContratoAssinaturaService(),
    );

    const resultado = await useCase.execute({ agenciaId: "ag-1", email: "socio@agencia.com" });

    expect(resultado.ok).toBe(false);
    expect((resultado as { motivo: string }).motivo).toContain("Atualizar informações");
  });

  it("busca o keySigner por e-mail (case-insensitive) e devolve o link", async () => {
    const contratoAssinaturaService = fakeContratoAssinaturaService({
      obterLinkAssinatura: jest.fn().mockResolvedValue("https://secure.d4sign.com.br/w/i/link"),
    });
    const useCase = new ObterLinkAssinaturaUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest
          .fn()
          .mockResolvedValue({ contratos: [{ id: "contrato-1", provedorId: "uuid-d4sign" }] }),
      }),
      fakeContratoAssinaturaRepository({
        findByContratoId: jest
          .fn()
          .mockResolvedValue([assinatura("Socio@Agencia.com", "a2V5LXNvY2lv")]),
      }),
      contratoAssinaturaService,
    );

    const resultado = await useCase.execute({ agenciaId: "ag-1", email: "socio@agencia.com" });

    expect(resultado).toEqual({ ok: true, link: "https://secure.d4sign.com.br/w/i/link" });
    expect(contratoAssinaturaService.obterLinkAssinatura).toHaveBeenCalledWith(
      "uuid-d4sign",
      "a2V5LXNvY2lv",
    );
  });

  it("retorna ok:false com o motivo quando o D4Sign lança (ex.: link ainda não disponível)", async () => {
    const contratoAssinaturaService = fakeContratoAssinaturaService({
      obterLinkAssinatura: jest.fn().mockRejectedValue(new Error("não enviado ainda")),
    });
    const useCase = new ObterLinkAssinaturaUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest
          .fn()
          .mockResolvedValue({ contratos: [{ id: "contrato-1", provedorId: "uuid-d4sign" }] }),
      }),
      fakeContratoAssinaturaRepository({
        findByContratoId: jest.fn().mockResolvedValue([assinatura("socio@agencia.com", "abc")]),
      }),
      contratoAssinaturaService,
    );

    const resultado = await useCase.execute({ agenciaId: "ag-1", email: "socio@agencia.com" });

    expect(resultado.ok).toBe(false);
    expect((resultado as { motivo: string }).motivo).toContain("não enviado ainda");
  });
});
