import { agenciaAdapter } from "@/modules/cadastro/adapters/agencia.adapter";
import { criarSocioWizardVazio } from "@/modules/cadastro/types/socio-wizard.types";
import { criarEnderecoBancoVazio } from "@/modules/cadastro/types/endereco-banco.types";
import type {
  CriarAgenciaResult,
  RawAnaliseContratoSocialResponse,
  RawAnaliseDocumentoIdentificacaoResponse,
} from "@/modules/cadastro/services/agencia.service";

function arquivoFake(nome: string): File {
  return new File([new Uint8Array(10)], nome, { type: "application/pdf" });
}

describe("agenciaAdapter.toCnpjLimpo", () => {
  it("remove a máscara do CNPJ antes de mandar pro service", () => {
    expect(agenciaAdapter.toCnpjLimpo("11.222.333/0001-81")).toBe("11222333000181");
  });
});

function socioContratoSocialFake(
  overrides: Partial<RawAnaliseContratoSocialResponse["socios"][number]> = {},
): RawAnaliseContratoSocialResponse["socios"][number] {
  return {
    nome: "Fulano de Tal",
    cpf: null,
    dataNascimento: null,
    estadoCivil: null,
    nacionalidade: null,
    regimeBens: null,
    participacao: null,
    rg: null,
    rgExpedidor: null,
    rgExpedidoUf: null,
    endereco: null,
    administrativo: null,
    ativo: null,
    ...overrides,
  };
}

describe("agenciaAdapter.toContratoSocialAnaliseView", () => {
  it("repassa o qsa completo por sócio (nome, cpf, RG, endereço, participação, administrativo/ativo)", () => {
    const raw: RawAnaliseContratoSocialResponse = {
      cnpjConfere: true,
      socios: [
        socioContratoSocialFake({
          nome: "Fulano de Tal",
          cpf: "111.444.777-35",
          dataNascimento: "1980-05-10",
          estadoCivil: "casado",
          nacionalidade: "brasileiro",
          regimeBens: "comunhão parcial de bens",
          participacao: 50,
          rg: "12.345.678-9",
          rgExpedidor: "SSP",
          rgExpedidoUf: "sp",
          endereco: {
            cep: "01310-100",
            logradouro: "Avenida Paulista",
            numero: "1000",
            complemento: null,
            bairro: "Bela Vista",
            municipio: "São Paulo",
            uf: "sp",
          },
          administrativo: true,
          ativo: true,
        }),
        socioContratoSocialFake({ nome: "Beltrana", participacao: 50 }),
      ],
      alertas: [],
      confianca: 0.9,
      razaoSocialExtraida: "Empresa Teste Ltda",
      capitalSocial: 100000,
      enderecoEmpresa: {
        cep: "01310-100",
        logradouro: "Avenida Paulista",
        numero: "1000",
        complemento: null,
        bairro: "Bela Vista",
        municipio: "São Paulo",
        uf: "sp",
      },
      objetoSocial: "Agenciamento de viagens",
      dataConstituicao: "2010-01-01",
    };

    const view = agenciaAdapter.toContratoSocialAnaliseView(raw);

    expect(view.socios.map((socio) => socio.nome)).toEqual(["Fulano de Tal", "Beltrana"]);
    expect(view.socios[0]?.cpf).toBe("11144477735");
    expect(view.socios[0]?.rgExpedidoUf).toBe("SP");
    expect(view.socios[0]?.endereco?.cidade).toBe("São Paulo");
    expect(view.socios[0]?.endereco?.uf).toBe("SP");
    expect(view.socios[0]?.participacao).toBe(50);
    expect(view.socios[0]?.administrativo).toBe(true);
    expect(view.socios[0]?.ativo).toBe(true);
    expect(view.razaoSocial).toBe("Empresa Teste Ltda");
    expect(view.capitalSocial).toBe(100000);
    expect(view.endereco?.cidade).toBe("São Paulo");
    expect(view.endereco?.uf).toBe("SP");
  });

  it("devolve endereco null quando o contrato social não trouxer nenhum campo", () => {
    const raw: RawAnaliseContratoSocialResponse = {
      cnpjConfere: null,
      socios: [],
      alertas: [],
      confianca: 0,
      razaoSocialExtraida: null,
      capitalSocial: null,
      enderecoEmpresa: null,
      objetoSocial: null,
      dataConstituicao: null,
    };

    const view = agenciaAdapter.toContratoSocialAnaliseView(raw);

    expect(view.endereco).toBeNull();
  });
});

describe("agenciaAdapter.toDocumentoIdentificacaoAnaliseView", () => {
  it("desmascara o CPF e deixa a UF do RG em maiúsculas", () => {
    const raw: RawAnaliseDocumentoIdentificacaoResponse = {
      nome: "Fulano de Tal",
      cpf: "111.444.777-35",
      dataNascimento: "1990-01-01",
      rg: "12.345.678-9",
      rgOrgaoEmissor: "SSP",
      rgUf: "sp",
      alertas: [],
      confianca: 0.9,
    };

    const view = agenciaAdapter.toDocumentoIdentificacaoAnaliseView(raw);

    expect(view.cpf).toBe("11144477735");
    expect(view.rgUf).toBe("SP");
    expect(view.rg).toBe("12.345.678-9");
  });

  it("devolve null pra rg/rgOrgaoEmissor/rgUf quando a IA não extraiu (campos especulativos)", () => {
    const raw: RawAnaliseDocumentoIdentificacaoResponse = {
      nome: null,
      cpf: null,
      dataNascimento: null,
      rg: null,
      rgOrgaoEmissor: null,
      rgUf: null,
      alertas: [],
      confianca: 0,
    };

    const view = agenciaAdapter.toDocumentoIdentificacaoAnaliseView(raw);

    expect(view.rg).toBeNull();
    expect(view.rgOrgaoEmissor).toBeNull();
    expect(view.rgUf).toBeNull();
  });
});

describe("agenciaAdapter.toSubmitResultView", () => {
  it("mapeia sucesso preservando o id da agência", () => {
    const resultado: CriarAgenciaResult = {
      ok: true,
      data: {
        id: "abc123",
        cnpj: "11222333000181",
        razaoSocial: "Empresa Teste Ltda",
        status: "em_analise",
      },
    };

    expect(agenciaAdapter.toSubmitResultView(resultado)).toEqual({
      success: true,
      agenciaId: "abc123",
    });
  });

  it("mapeia falha preservando a flag de duplicado e a mensagem de erro", () => {
    const resultado: CriarAgenciaResult = {
      ok: false,
      duplicado: true,
      error: "Esta agência já está cadastrada.",
    };

    expect(agenciaAdapter.toSubmitResultView(resultado)).toEqual({
      success: false,
      duplicado: true,
      error: "Esta agência já está cadastrada.",
    });
  });
});

describe("agenciaAdapter.toFinalizarCadastroFormData", () => {
  function paramsBase() {
    return {
      cnpjMascarado: "11.222.333/0001-81",
      razaoSocial: "Empresa Teste Ltda",
      contratoSocial: arquivoFake("contrato.pdf"),
      origem: "evento-teste",
      executivoId: null,
      associacaoId: null,
      eventoId: null,
      telefoneComercial: "(11) 99999-9999",
      telefoneComercialPais: "BR",
      semTelefoneComercial: false,
      emailOperacional: "operacional@empresa.com",
      emailComercial: "comercial@empresa.com",
      emailFinanceiro: "financeiro@empresa.com",
      socios: [{ ...criarSocioWizardVazio("Fulano de Tal"), cpf: "111.444.777-35" }],
      enderecoBanco: criarEnderecoBancoVazio(),
    };
  }

  it("remove a máscara do CNPJ e inclui a origem quando presente", () => {
    const formData = agenciaAdapter.toFinalizarCadastroFormData(paramsBase());

    expect(formData.get("cnpj")).toBe("11222333000181");
    expect(formData.get("origem")).toBe("evento-teste");
  });

  it("omite a origem quando é null", () => {
    const formData = agenciaAdapter.toFinalizarCadastroFormData({
      ...paramsBase(),
      origem: null,
    });

    expect(formData.get("origem")).toBeNull();
  });

  it("prefixa o telefone comercial com o DDI do país escolhido", () => {
    const formData = agenciaAdapter.toFinalizarCadastroFormData(paramsBase());
    expect(formData.get("telefoneComercial")).toBe("+55 (11) 99999-9999");
  });

  it("remove a máscara do CPF de cada sócio no payload JSON", () => {
    const formData = agenciaAdapter.toFinalizarCadastroFormData(paramsBase());
    const socios = JSON.parse(formData.get("socios") as string);

    expect(socios[0].cpf).toBe("11144477735");
    expect(socios[0].nome).toBe("Fulano de Tal");
  });

  it("só anexa o arquivo de procuração se o sócio for representante", () => {
    const socioRepresentante = {
      ...criarSocioWizardVazio("Representante"),
      isRepresentante: true,
      procuracaoArquivo: arquivoFake("procuracao.pdf"),
    };
    const socioComum = {
      ...criarSocioWizardVazio("Comum"),
      procuracaoArquivo: arquivoFake("nao-deveria-ir.pdf"),
    };

    const formData = agenciaAdapter.toFinalizarCadastroFormData({
      ...paramsBase(),
      socios: [socioRepresentante, socioComum],
    });

    expect(formData.get("socio-0-procuracao")).toBeInstanceOf(File);
    expect(formData.get("socio-1-procuracao")).toBeNull();
  });

  it("usa o endereço do sócio vinculado quando enderecoMesmoSocio está marcado", () => {
    const socio = {
      ...criarSocioWizardVazio("Fulano"),
      cep: "01310-100",
      logradouro: "Avenida Paulista",
      numero: "1000",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
    };

    const formData = agenciaAdapter.toFinalizarCadastroFormData({
      ...paramsBase(),
      socios: [socio],
      enderecoBanco: {
        ...criarEnderecoBancoVazio(),
        enderecoMesmoSocio: true,
        socioEnderecoVinculado: 0,
        cep: "99999-999", // não deveria ser usado
      },
    });

    const enderecoBanco = JSON.parse(formData.get("enderecoBanco") as string);
    expect(enderecoBanco.endereco.cep).toBe("01310100");
    expect(enderecoBanco.endereco.logradouro).toBe("Avenida Paulista");
  });

  it("usa o endereço manual da agência quando não está vinculado a um sócio", () => {
    const formData = agenciaAdapter.toFinalizarCadastroFormData({
      ...paramsBase(),
      enderecoBanco: {
        ...criarEnderecoBancoVazio(),
        enderecoMesmoSocio: false,
        cep: "01310-100",
        logradouro: "Avenida Paulista",
      },
    });

    const enderecoBanco = JSON.parse(formData.get("enderecoBanco") as string);
    expect(enderecoBanco.endereco.cep).toBe("01310100");
    expect(enderecoBanco.endereco.logradouro).toBe("Avenida Paulista");
  });
});
