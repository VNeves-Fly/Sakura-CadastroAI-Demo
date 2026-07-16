export const TIPO_CONTA_OPCOES = [
  { valor: "corrente", label: "Corrente" },
  { valor: "poupanca", label: "Poupança" },
  { valor: "pagamento", label: "Pagamento" },
];

export const BANCO_PAIS_OPCOES = [
  { valor: "nacional", label: "Nacional", bandeira: "🇧🇷" },
  { valor: "internacional", label: "Internacional", bandeira: "🌐" },
];

export const BANCOS_BRASILEIROS = [
  "Banco do Brasil",
  "Bradesco",
  "Itaú Unibanco",
  "Caixa Econômica Federal",
  "Santander",
  "Nubank",
  "Inter",
  "BTG Pactual",
  "Sicoob",
  "Sicredi",
  "C6 Bank",
  "Banco Original",
  "Banco Safra",
  "Banrisul",
  "Mercado Pago",
  "PagBank",
];

export interface EnderecoBancoFormValues {
  enderecoMesmoSocio: boolean | null;
  socioEnderecoVinculado: number | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;

  bancoPais: string;
  bancoNome: string;
  bancoAgencia: string;
  bancoConta: string;
  bancoSwift: string;
  tipoConta: string;
  favorecidoEhEmpresa: boolean;
  favorecidoNome: string;
  favorecidoDoc: string;
}

export function criarEnderecoBancoVazio(): EnderecoBancoFormValues {
  return {
    enderecoMesmoSocio: null,
    socioEnderecoVinculado: null,
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    bancoPais: "nacional",
    bancoNome: "",
    bancoAgencia: "",
    bancoConta: "",
    bancoSwift: "",
    tipoConta: "",
    favorecidoEhEmpresa: false,
    favorecidoNome: "",
    favorecidoDoc: "",
  };
}
