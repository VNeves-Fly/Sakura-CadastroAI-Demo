export interface GerarContratoEndereco {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface ContratoSignatario {
  nome: string;
  email: string;
  cpf: string;
  // Snapshot no momento da geração — usados por formatarClausulaSocio pra
  // montar a cláusula jurídica do template (ver clausula-contrato.formatter).
  rgNumero: string | null;
  rgOrgaoEmissor: string | null;
  nacionalidade: string | null;
  estadoCivil: string | null;
  dataNascimento: Date | null;
  endereco: GerarContratoEndereco;
}

export interface GerarContratoInput {
  cnpj: string;
  razaoSocial: string;
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
