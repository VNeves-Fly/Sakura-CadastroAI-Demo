import { TestarConexaoSstUseCase } from "@/modules/cadastro/application/use-cases/testar-conexao-sst.use-case";
import type { SstService } from "@/modules/cadastro/domain/services/sst-service";

function sstServiceFake(overrides: Partial<SstService> = {}): SstService {
  return {
    consultarSicaCNPJ: jest.fn(),
    consultarSicaCodigoEmpresa: jest.fn(),
    verificarConexao: jest.fn(),
    ...overrides,
  } as unknown as SstService;
}

describe("TestarConexaoSstUseCase", () => {
  it("devolve sucesso com o status e os databases quando o SST responde", async () => {
    const sstService = sstServiceFake({
      verificarConexao: jest.fn().mockResolvedValue({
        status: "healthy",
        databases: { sica: "healthy", sigot: "healthy" },
      }),
    });
    const useCase = new TestarConexaoSstUseCase(sstService);

    const resultado = await useCase.execute();

    expect(resultado).toEqual({
      sucesso: true,
      mensagem: 'SST respondeu "healthy".',
      databases: { sica: "healthy", sigot: "healthy" },
    });
  });

  it("devolve sucesso: false com a mensagem de erro quando a chamada falha", async () => {
    const sstService = sstServiceFake({
      verificarConexao: jest.fn().mockRejectedValue(new Error("SST respondeu 503: indisponível")),
    });
    const useCase = new TestarConexaoSstUseCase(sstService);

    const resultado = await useCase.execute();

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "SST respondeu 503: indisponível",
    });
  });

  it("usa mensagem genérica quando o erro capturado não é um Error", async () => {
    const sstService = sstServiceFake({
      verificarConexao: jest.fn().mockRejectedValue("string qualquer"),
    });
    const useCase = new TestarConexaoSstUseCase(sstService);

    const resultado = await useCase.execute();

    expect(resultado).toEqual({ sucesso: false, mensagem: "Falha ao conectar com o SST." });
  });
});
