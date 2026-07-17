export interface ContratoSignatario {
  nome: string;
  email: string;
  cpf: string;
}

export interface GerarContratoEndereco {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface GerarContratoInput {
  cnpj: string;
  razaoSocial: string;
  // Origem do cadastro (UTM/campanha) — mapeia pro token "indicacao" do
  // template de contrato real (D4SignAdapter). Mock ignora.
  origem: string | null;
  endereco: GerarContratoEndereco;
  signatarios: ContratoSignatario[];
}

export interface GerarContratoResult {
  provedorId: string;
  status: string;
}

export interface ContratoAssinaturaService {
  gerarEEnviar(input: GerarContratoInput): Promise<GerarContratoResult>;
}
