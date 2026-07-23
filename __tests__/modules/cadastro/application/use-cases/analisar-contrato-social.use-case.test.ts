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
  it("expõe razaoSocialExtraida, capitalSocial (número), enderecoEmpresa (objeto), objetoSocial e dataConstituicao", async () => {
    const useCase = criarUseCase({
      cnpj: "62572350000180",
      qsa: [{ nome: "BRUNO HENRIQUE NASCIMENTO BAZOTI" }],
      razao_social: "LARIAN GROUP LTDA",
      capital_social: "784.314,00",
      endereco: {
        cep: "04121-002",
        logradouro: "Rua Santa Cruz",
        numero: "2187",
        complemento: "sala 10",
        bairro: "Vila Mariana",
        municipio: "São Paulo",
        uf: "SP",
      },
      objeto_social: "Administração e participação em outras sociedades",
      data_constituicao: "16 de dezembro de 2025",
    });

    const resultado = await useCase.execute({ cnpj: "62572350000180", contratoSocial: ARQUIVO });

    expect(resultado.razaoSocialExtraida).toBe("LARIAN GROUP LTDA");
    expect(resultado.capitalSocial).toBe(784314);
    expect(resultado.enderecoEmpresa).toEqual({
      cep: "04121-002",
      logradouro: "Rua Santa Cruz",
      numero: "2187",
      complemento: "sala 10",
      bairro: "Vila Mariana",
      municipio: "São Paulo",
      uf: "SP",
    });
    expect(resultado.objetoSocial).toBe("Administração e participação em outras sociedades");
    expect(resultado.dataConstituicao).toBe("16 de dezembro de 2025");
  });

  it("devolve null pros campos novos quando a IA não os extrai, em vez de lançar erro", async () => {
    const useCase = criarUseCase({
      cnpj: "62572350000180",
      qsa: [{ nome: "BRUNO HENRIQUE NASCIMENTO BAZOTI" }],
      // razao_social, capital_social, endereco, objeto_social e
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

  it("devolve null quando a IA manda um tipo inesperado pro campo", async () => {
    const useCase = criarUseCase({
      razao_social: 12345,
      capital_social: { valor: 784314 },
      endereco: "Rua Santa Cruz, 2187",
    });

    const resultado = await useCase.execute({ cnpj: "62572350000180", contratoSocial: ARQUIVO });

    expect(resultado.razaoSocialExtraida).toBeNull();
    expect(resultado.capitalSocial).toBeNull();
    expect(resultado.enderecoEmpresa).toBeNull();
  });

  it("aceita capital_social já como número", async () => {
    const useCase = criarUseCase({ capital_social: 784314 });

    const resultado = await useCase.execute({ cnpj: "62572350000180", contratoSocial: ARQUIVO });

    expect(resultado.capitalSocial).toBe(784314);
  });

  it("extrai o qsa completo por sócio: cpf, data de nascimento, rg, endereço, participação e campos derivados", async () => {
    const useCase = criarUseCase({
      qsa: [
        {
          nome: "Fulano de Tal",
          cpf: "111.444.777-35",
          data_nascimento: "10/05/1980",
          estado_civil: "casado",
          nacionalidade: "brasileiro",
          regime_bens: "comunhão parcial de bens",
          participacao: "50%",
          rg: "12.345.678-9",
          rg_expedidor: "SSP",
          rg_expedido_uf: "SP",
          endereco: {
            cep: "01310-100",
            logradouro: "Avenida Paulista",
            numero: "1000",
            bairro: "Bela Vista",
            municipio: "São Paulo",
            uf: "SP",
          },
          administrativo: true,
          ativo: true,
        },
      ],
    });

    const resultado = await useCase.execute({ cnpj: "62572350000180", contratoSocial: ARQUIVO });

    expect(resultado.socios).toEqual([
      {
        nome: "Fulano de Tal",
        cpf: "111.444.777-35",
        dataNascimento: "1980-05-10",
        estadoCivil: "casado",
        nacionalidade: "brasileiro",
        regimeBens: "comunhão parcial de bens",
        participacao: 50,
        rg: "12.345.678-9",
        rgExpedidor: "SSP",
        rgExpedidoUf: "SP",
        endereco: {
          cep: "01310-100",
          logradouro: "Avenida Paulista",
          numero: "1000",
          complemento: null,
          bairro: "Bela Vista",
          municipio: "São Paulo",
          uf: "SP",
        },
        administrativo: true,
        ativo: true,
      },
    ]);
  });

  it("aceita administrativo/ativo como texto 'true'/'false' (schema de origem não tem booleano)", async () => {
    const useCase = criarUseCase({
      qsa: [{ nome: "Fulano", administrativo: "true", ativo: "false" }],
    });

    const resultado = await useCase.execute({ cnpj: "62572350000180", contratoSocial: ARQUIVO });

    expect(resultado.socios[0]?.administrativo).toBe(true);
    expect(resultado.socios[0]?.ativo).toBe(false);
  });

  it("sócio sem nome legível é descartado", async () => {
    const useCase = criarUseCase({
      qsa: [{ cpf: "111.444.777-35" }, { nome: "Beltrana" }],
    });

    const resultado = await useCase.execute({ cnpj: "62572350000180", contratoSocial: ARQUIVO });

    expect(resultado.socios.map((s) => s.nome)).toEqual(["Beltrana"]);
  });

  it("degrada com segurança quando `qsa` vem em formato inesperado, sem lançar erro", async () => {
    const useCase = criarUseCase({
      qsa: "não é uma lista",
    });

    const resultado = await useCase.execute({ cnpj: "62572350000180", contratoSocial: ARQUIVO });

    expect(resultado.socios).toEqual([]);
  });
});
