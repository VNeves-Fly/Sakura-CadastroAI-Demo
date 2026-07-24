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
