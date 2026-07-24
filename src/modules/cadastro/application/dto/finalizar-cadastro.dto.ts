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
  dataNascimento: string; // ISO (YYYY-MM-DD)
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
  bancoCodigo: string;
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
  // Extraída do contrato social durante o preenchimento (Passo 1) — o que
  // o usuário viu na revisão é o que é persistido; sem isso, cai no CNPJ
  // (ver FinalizarCadastroUseCase).
  razaoSocial: string;
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
  // Sempre "em_analise" nesta resposta — a IA ainda não rodou (roda
  // depois, em background — ver AnalisarCadastroUseCase). O desfecho
  // final (aprovado/revisão manual) não é conhecido na hora do submit.
  status: string;
}
