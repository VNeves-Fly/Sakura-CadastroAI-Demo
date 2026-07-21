import { AnalisarContratoSocialUseCase } from "@/modules/cadastro/application/use-cases/analisar-contrato-social.use-case";
import type { FileStorage } from "@/modules/cadastro/domain/services/file-storage";
import type {
  DocumentAnalysisResultado,
  DocumentAnalysisService,
} from "@/modules/cadastro/domain/services/document-analysis-service";

const ARQUIVO = {
  buffer: Buffer.from("pdf"),
  originalName: "contrato.pdf",
  mimeType: "application/pdf",
};

function criarUseCase(camposExtraidos: Record<string, unknown>) {
  const fileStorage: FileStorage = {
    save: jest
      .fn()
      .mockResolvedValue({ path: "agencias/x/contrato-social-preview-1.pdf", bucket: "b" }),
  };

  const resultado: DocumentAnalysisResultado = {
    camposExtraidos,
    camposExtras: {},
    confiancaExtracao: 0.98,
    alertas: [],
    resumoAnalise: null,
    textoBruto: null,
    checagens: null,
  };

  const documentAnalysisService: DocumentAnalysisService = {
    analisar: jest.fn().mockResolvedValue(resultado),
  };

  return new AnalisarContratoSocialUseCase(fileStorage, documentAnalysisService);
}

describe("AnalisarContratoSocialUseCase", () => {
  it("expõe razaoSocialExtraida, capitalSocial, enderecoEmpresa, objetoSocial e dataConstituicao quando a IA extrai esses campos", async () => {
    const useCase = criarUseCase({
      cnpj: "62572350000180",
      socios_nomes_completos: ["BRUNO HENRIQUE NASCIMENTO BAZOTI"],
      razao_social: "LARIAN GROUP LTDA",
      capital_social: "R$ 784.314,00",
      endereco_completo:
        "Rua Santa Cruz, nº 2.187, sala 10, bairro Vila Mariana, São Paulo/SP, CEP 04.121-002",
      objeto_social: "Administração e participação em outras sociedades",
      data_constituicao: "16 de dezembro de 2025",
    });

    const resultado = await useCase.execute({ cnpj: "62572350000180", contratoSocial: ARQUIVO });

    expect(resultado.razaoSocialExtraida).toBe("LARIAN GROUP LTDA");
    expect(resultado.capitalSocial).toBe("R$ 784.314,00");
    expect(resultado.enderecoEmpresa).toBe(
      "Rua Santa Cruz, nº 2.187, sala 10, bairro Vila Mariana, São Paulo/SP, CEP 04.121-002",
    );
    expect(resultado.objetoSocial).toBe("Administração e participação em outras sociedades");
    expect(resultado.dataConstituicao).toBe("16 de dezembro de 2025");
  });

  it("devolve null pros campos novos quando a IA não os extrai, em vez de lançar erro", async () => {
    const useCase = criarUseCase({
      cnpj: "62572350000180",
      socios_nomes_completos: ["BRUNO HENRIQUE NASCIMENTO BAZOTI"],
      // razao_social, capital_social, endereco_completo, objeto_social e
      // data_constituicao ausentes de propósito — documento sem essas
      // informações legíveis.
    });

    const resultado = await useCase.execute({ cnpj: "62572350000180", contratoSocial: ARQUIVO });

    expect(resultado.razaoSocialExtraida).toBeNull();
    expect(resultado.capitalSocial).toBeNull();
    expect(resultado.enderecoEmpresa).toBeNull();
    expect(resultado.objetoSocial).toBeNull();
    expect(resultado.dataConstituicao).toBeNull();
  });

  it("devolve null quando a IA manda um tipo inesperado (não string) pro campo", async () => {
    const useCase = criarUseCase({
      razao_social: 12345,
      capital_social: { valor: 784314 },
      endereco_completo: null,
    });

    const resultado = await useCase.execute({ cnpj: "62572350000180", contratoSocial: ARQUIVO });

    expect(resultado.razaoSocialExtraida).toBeNull();
    expect(resultado.capitalSocial).toBeNull();
    expect(resultado.enderecoEmpresa).toBeNull();
  });
});
