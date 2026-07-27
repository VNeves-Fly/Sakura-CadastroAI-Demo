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

export interface ArquivoContrato {
  buffer: Buffer;
  mimeType: string;
}

export interface DocumentoD4SignInfo {
  existe: boolean;
  nomeDocumento: string | null;
  statusName: string | null;
}

export interface ContratoAssinaturaService {
  gerarEEnviar(input: GerarContratoInput): Promise<GerarContratoResult>;
  // Baixa o PDF atual do documento no D4Sign, qualquer que seja o estágio
  // de assinatura em que ele esteja — usado pelo botão "Visualizar
  // Documento" na ficha do cadastro.
  visualizarDocumento(provedorId: string): Promise<ArquivoContrato>;
  // Confirma que um documento existe no D4Sign (usado ao registrar um
  // contrato assinado por fora da plataforma) — `existe: false` cobre
  // tanto "não encontrado" quanto qualquer erro de comunicação, já que
  // pro caller as duas situações pedem a mesma resposta ("não deu pra
  // confirmar esse ID, confira e tente de novo").
  obterDocumento(provedorId: string): Promise<DocumentoD4SignInfo>;
  // E-mails dos destinatários cadastrados no documento — usado só pra
  // validar que o ID colado corresponde à agência certa, não pra
  // reconstruir ContratoSignatario.
  obterDestinatarios(provedorId: string): Promise<string[]>;
  // Registra nosso endpoint de webhook num documento que não passou por
  // gerarEEnviar (ex.: contrato assinado por fora, registrado depois).
  // `registrado: false` quando D4SIGN_WEBHOOK_URL não está configurada —
  // diferente de gerarEEnviar (que pula em silêncio), aqui o caller
  // precisa saber pra avisar o analista.
  registrarWebhook(provedorId: string): Promise<{ registrado: boolean }>;
}
