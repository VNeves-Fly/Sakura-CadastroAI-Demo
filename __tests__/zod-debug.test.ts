import { finalizarCadastroMetaSchema } from "@/modules/cadastro/application/dto/finalizar-cadastro.schema";

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
    telefoneComercial: "+55 11999999999",
    semTelefoneComercial: false,
    emailOperacional: "operacional@empresa.com",
    emailComercial: "comercial@empresa.com",
    emailFinanceiro: "financeiro@empresa.com",
    socios: [socioValido()],
    enderecoBanco: enderecoBancoValido(),
  };
}

test("debug", () => {
  const r = finalizarCadastroMetaSchema.safeParse(payloadValido());
  if (!r.success) {
    console.log(JSON.stringify(r.error.issues, null, 2));
  }
  expect(r.success).toBe(true);
});
