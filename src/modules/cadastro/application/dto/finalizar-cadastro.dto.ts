export interface UploadedFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface EnderecoInput {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface SocioSubmitInput {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  estadoCivil: string;
  endereco: EnderecoInput;
  rg: UploadedFileInput;
  isRepresentante: boolean;
  procuracao: UploadedFileInput | null;
}

export interface EnderecoBancoSubmitInput {
  enderecoMesmoSocio: boolean;
  socioEnderecoVinculado: number | null;
  endereco: EnderecoInput | null;
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

export interface FinalizarCadastroInput {
  cnpj: string;
  contratoSocial: UploadedFileInput;
  origem: string | null;
  telefoneComercial: string;
  emailOperacional: string;
  emailComercial: string;
  emailFinanceiro: string;
  socios: SocioSubmitInput[];
  enderecoBanco: EnderecoBancoSubmitInput;
}

export interface FinalizarCadastroOutput {
  id: string;
  cnpj: string;
  razaoSocial: string;
  status: string;
}
