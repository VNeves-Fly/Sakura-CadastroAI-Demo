export const TIPO_CONTA_OPCOES = [
  { valor: "corrente", label: "Corrente" },
  { valor: "poupanca", label: "Poupança" },
  { valor: "pagamento", label: "Pagamento" },
];

export const BANCO_PAIS_OPCOES = [
  { valor: "nacional", label: "Nacional", bandeira: "🇧🇷" },
  { valor: "internacional", label: "Internacional", bandeira: "🌐" },
];

// Bancos nacionais do wizard /cadastro vêm da BrasilAPI (ver
// agenciaService.listarBancos) — código + nome, pro combobox buscável do
// Passo 6. `nomeCompleto` fica disponível caso o nome curto não seja
// suficiente em algum lugar (hoje não é usado).
export interface Banco {
  codigo: string;
  nome: string;
  nomeCompleto: string;
}

// Lista estática usada só pelo wizard /chat (use-chat-script.ts), que
// monta campos de formulário síncronos — não tem como buscar a lista via
// BrasilAPI sem reestruturar aquele fluxo. O wizard /cadastro usa `Banco`
// acima, via API.
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
  enderecoMesmoSocio: boolean;
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
  bancoCodigo: string;
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
    enderecoMesmoSocio: false,
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
    bancoCodigo: "",
    bancoAgencia: "",
    bancoConta: "",
    bancoSwift: "",
    tipoConta: "",
    favorecidoEhEmpresa: false,
    favorecidoNome: "",
    favorecidoDoc: "",
  };
}
