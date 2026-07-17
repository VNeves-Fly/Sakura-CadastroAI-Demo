export interface ContratoSignatario {
  nome: string;
  email: string;
  cpf: string;
}

export interface GerarContratoInput {
  cnpj: string;
  razaoSocial: string;
  signatarios: ContratoSignatario[];
}

export interface GerarContratoResult {
  provedorId: string;
  status: string;
}

export interface ContratoAssinaturaService {
  gerarEEnviar(input: GerarContratoInput): Promise<GerarContratoResult>;
}
