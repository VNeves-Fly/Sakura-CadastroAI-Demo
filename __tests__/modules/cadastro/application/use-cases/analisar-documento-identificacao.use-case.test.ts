import { AnalisarDocumentoIdentificacaoUseCase } from "@/modules/cadastro/application/use-cases/analisar-documento-identificacao.use-case";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type {
  DocumentAnalysisResultado,
  DocumentAnalysisService,
} from "@/modules/cadastro/domain/services/document-analysis-service";

const ARQUIVO = { buffer: Buffer.from("pdf"), originalName: "rg.pdf", mimeType: "application/pdf" };

function criarUseCase(camposExtraidos: Record<string, unknown>, alertas: string[] = []) {
  const fileStorage: FileStorage = {
    save: jest
      .fn()
      .mockResolvedValue({ path: "agencias/x/socio-0-identificacao-preview-1.pdf", bucket: "b" }),
  };

  const resultado: DocumentAnalysisResultado = {
    camposExtraidos,
    camposExtras: {},
    confiancaExtracao: 1,
    alertas,
    resumoAnalise: null,
    textoBruto: null,
    checagens: null,
  };

  const documentAnalysisService: DocumentAnalysisService = {
    analisar: jest.fn().mockResolvedValue(resultado),
  };

  return new AnalisarDocumentoIdentificacaoUseCase(fileStorage, documentAnalysisService);
}

describe("AnalisarDocumentoIdentificacaoUseCase", () => {
  it("extrai nome (de nome_completo), cpf e converte dataNascimento de DD/MM/YYYY pra ISO", async () => {
    const useCase = criarUseCase({
      tipo_documento_identificado: "CNH",
      nome_completo: "BRUNO HENRIQUE NASCIMENTO BAZOTI",
      cpf: "029.497.491-19",
      data_nascimento: "29/12/1989",
    });

    const resultado = await useCase.execute({
      cnpj: "62572350000180",
      indice: 0,
      documento: ARQUIVO,
    });

    expect(resultado.nome).toBe("BRUNO HENRIQUE NASCIMENTO BAZOTI");
    expect(resultado.cpf).toBe("029.497.491-19");
    expect(resultado.dataNascimento).toBe("1989-12-29");
  });

  it("aceita data já em ISO sem quebrar", async () => {
    const useCase = criarUseCase({ data_nascimento: "1989-12-29" });

    const resultado = await useCase.execute({
      cnpj: "62572350000180",
      indice: 0,
      documento: ARQUIVO,
    });

    expect(resultado.dataNascimento).toBe("1989-12-29");
  });

  it("devolve dataNascimento null pra data de calendário inválida (ex: 31/02) em vez de normalizar silenciosamente", async () => {
    const useCase = criarUseCase({ data_nascimento: "31/02/1990" });

    const resultado = await useCase.execute({
      cnpj: "62572350000180",
      indice: 0,
      documento: ARQUIVO,
    });

    expect(resultado.dataNascimento).toBeNull();
  });

  it("devolve null pros campos ausentes ou em formato inesperado, sem lançar erro", async () => {
    const useCase = criarUseCase({});

    const resultado = await useCase.execute({
      cnpj: "62572350000180",
      indice: 0,
      documento: ARQUIVO,
    });

    expect(resultado.nome).toBeNull();
    expect(resultado.cpf).toBeNull();
    expect(resultado.dataNascimento).toBeNull();
  });

  it("não usa mais a chave antiga 'nome' (regressão do bug original)", async () => {
    const useCase = criarUseCase({ nome: "NOME ERRADO", nome_completo: "NOME CERTO" });

    const resultado = await useCase.execute({
      cnpj: "62572350000180",
      indice: 0,
      documento: ARQUIVO,
    });

    expect(resultado.nome).toBe("NOME CERTO");
  });
});
