import {
  enderecoBancoMetaSchema,
  finalizarCadastroMetaSchema,
  socioMetaSchema,
} from "@/modules/cadastro/application/dto/finalizar-cadastro.schema";

function enderecoValido() {
  return {
    cep: "01310100",
    logradouro: "Avenida Paulista",
    numero: "1000",
    complemento: "",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
  };
}

function socioValido() {
  return {
    nome: "Fulano de Tal",
    cpf: "11144477735",
    email: "fulano@empresa.com",
    telefone: "+55 11999999999",
    dataNascimento: "1990-04-12",
    estadoCivil: "solteiro",
    rgNumero: "123456789",
    rgOrgaoEmissor: "SSP/SP",
    nacionalidade: "Brasileiro(a)",
    administrativo: null,
    endereco: enderecoValido(),
    isRepresentante: false,
  };
}

function enderecoBancoValido() {
  return {
    enderecoMesmoSocio: false,
    socioEnderecoVinculado: null,
    endereco: enderecoValido(),
    bancoPais: "nacional",
    bancoNome: "Banco do Brasil",
    bancoCodigo: "001",
    bancoAgencia: "1234",
    bancoConta: "56789-0",
    bancoSwift: "",
    tipoConta: "corrente",
    favorecidoEhEmpresa: true,
    favorecidoNome: "Empresa Teste Ltda",
    favorecidoDoc: "11222333000181",
  };
}

function payloadValido() {
  return {
    cnpj: "11222333000181",
    razaoSocial: "Empresa Teste Ltda",
    nomeFantasia: "",
    telefoneComercial: "+55 11999999999",
    semTelefoneComercial: false,
    emailOperacional: "operacional@empresa.com",
    emailComercial: "comercial@empresa.com",
    emailFinanceiro: "financeiro@empresa.com",
    socios: [socioValido()],
    enderecoBanco: enderecoBancoValido(),
  };
}

describe("finalizarCadastroMetaSchema — payload completo válido", () => {
  it("aceita o payload de referência sem alterações", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse(payloadValido());
    expect(resultado.success).toBe(true);
  });
});

describe("finalizarCadastroMetaSchema — e-mails da empresa (opcionais)", () => {
  it("aceita os 3 e-mails vazios", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      emailOperacional: "",
      emailComercial: "",
      emailFinanceiro: "",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita e-mail preenchido com formato inválido", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      emailOperacional: "nao-e-um-email",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((i) => i.path.includes("emailOperacional"))).toBe(true);
    }
  });
});

describe("finalizarCadastroMetaSchema — telefone comercial (obrigatório, salvo exceção)", () => {
  it("rejeita telefone vazio quando semTelefoneComercial é false", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      telefoneComercial: "",
      semTelefoneComercial: false,
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((i) => i.path.includes("telefoneComercial"))).toBe(true);
    }
  });

  it("aceita telefone vazio quando semTelefoneComercial é true", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      telefoneComercial: "",
      semTelefoneComercial: true,
    });
    expect(resultado.success).toBe(true);
  });
});

describe("finalizarCadastroMetaSchema — cnpj", () => {
  it("rejeita CNPJ com máscara (a validação de dígito verificador é feita antes, aqui só o formato)", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      cnpj: "11.222.333/0001-81",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita CNPJ curto demais", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      cnpj: "112223330001",
    });
    expect(resultado.success).toBe(false);
  });
});

describe("finalizarCadastroMetaSchema — sócios", () => {
  it("rejeita lista de sócios vazia", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({ ...payloadValido(), socios: [] });
    expect(resultado.success).toBe(false);
  });

  it("rejeita dois sócios com o mesmo CPF", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      socios: [socioValido(), { ...socioValido(), nome: "Outro Nome", email: "outro@empresa.com" }],
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((i) => i.path.includes("cpf"))).toBe(true);
    }
  });

  it("rejeita dois sócios com CPF formatado de forma diferente mas equivalente", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      socios: [
        { ...socioValido(), cpf: "111.444.777-35" },
        { ...socioValido(), cpf: "11144477735", nome: "Outro Nome", email: "outro@empresa.com" },
      ],
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita dois sócios com o mesmo e-mail", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      socios: [socioValido(), { ...socioValido(), nome: "Outro Nome", cpf: "52998224725" }],
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((i) => i.path.includes("email"))).toBe(true);
    }
  });

  it("rejeita e-mail duplicado com capitalização diferente", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      socios: [
        { ...socioValido(), email: "Fulano@Empresa.com" },
        { ...socioValido(), cpf: "52998224725", nome: "Outro Nome", email: "fulano@empresa.com" },
      ],
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita sócios distintos com CPF e e-mail únicos", () => {
    const resultado = finalizarCadastroMetaSchema.safeParse({
      ...payloadValido(),
      socios: [
        socioValido(),
        { ...socioValido(), nome: "Outro Nome", cpf: "52998224725", email: "outro@empresa.com" },
      ],
    });
    expect(resultado.success).toBe(true);
  });
});

describe("socioMetaSchema", () => {
  it("e-mail do sócio continua obrigatório (só o da empresa ficou opcional)", () => {
    const resultado = socioMetaSchema.safeParse({ ...socioValido(), email: "" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita data de nascimento vazia", () => {
    const resultado = socioMetaSchema.safeParse({ ...socioValido(), dataNascimento: "" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita data de nascimento no futuro", () => {
    const anoQueVem = new Date().getFullYear() + 1;
    const resultado = socioMetaSchema.safeParse({
      ...socioValido(),
      dataNascimento: `${anoQueVem}-01-01`,
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita sócio menor de idade", () => {
    const hoje = new Date();
    const nascimentoMenor = `${hoje.getFullYear() - 10}-01-01`;
    const resultado = socioMetaSchema.safeParse({
      ...socioValido(),
      dataNascimento: nascimentoMenor,
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita data de nascimento válida (maior de idade)", () => {
    const resultado = socioMetaSchema.safeParse(socioValido());
    expect(resultado.success).toBe(true);
  });
});

describe("enderecoBancoMetaSchema — internacional exige SWIFT", () => {
  it("rejeita conta internacional sem SWIFT/BIC", () => {
    const resultado = enderecoBancoMetaSchema.safeParse({
      ...enderecoBancoValido(),
      bancoPais: "internacional",
      bancoSwift: "",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((i) => i.path.includes("bancoSwift"))).toBe(true);
    }
  });

  it("aceita conta internacional com SWIFT preenchido", () => {
    const resultado = enderecoBancoMetaSchema.safeParse({
      ...enderecoBancoValido(),
      bancoPais: "internacional",
      bancoSwift: "BOFAUS3N",
    });
    expect(resultado.success).toBe(true);
  });

  it("conta nacional não exige SWIFT", () => {
    const resultado = enderecoBancoMetaSchema.safeParse({
      ...enderecoBancoValido(),
      bancoPais: "nacional",
      bancoSwift: "",
    });
    expect(resultado.success).toBe(true);
  });
});
