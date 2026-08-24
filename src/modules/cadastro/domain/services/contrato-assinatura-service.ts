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
  // Fluxo paralelo de biometria facial (Legitimuz) por agência — ver
  // docs/legitimuz/. Quando true: sócios NÃO recebem docauthandselfie/
  // videoselfie no createlist (a Legitimuz já cobre a verificação de
  // identidade antes da assinatura) e sendtosigner vai com skip_email:"1"
  // (D4Sign não notifica ninguém sozinho — a entrega dos links vira
  // responsabilidade da nossa aplicação). false preserva o comportamento
  // de sempre.
  gateBiometriaAtivo: boolean;
}

export interface SignatarioKeySigner {
  email: string;
  keySigner: string | null;
}

export interface GerarContratoResult {
  provedorId: string;
  status: string;
  // Melhor esforço — capturado direto da resposta do createlist (ver
  // D4SignAdapter.cadastrarSignatarios), pra já habilitar o botão "Ver/
  // copiar link" sem precisar de um "Atualizar informações" manual depois.
  // Formato de resposta do createlist NÃO confirmado ao vivo (só na doc
  // oficial) — pode vir vazio se o parsing não reconhecer o formato; nesse
  // caso o sync manual (SincronizarContratoD4SignUseCase) continua sendo o
  // fallback, exatamente como funcionava antes desta captura existir.
  signatariosKeySigner: SignatarioKeySigner[];
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

export interface DestinatarioD4Sign {
  email: string;
  // Confirmado ao vivo (2026-07-30) — `signed` vem como string "1"/"0" na
  // resposta real. `null` só resta se o formato variar por conta/versão e
  // nenhum campo reconhecido bater (ver D4SignAdapter.obterDestinatarios) —
  // nunca assume "pendente" nesse caso.
  assinado: boolean | null;
  assinadoEm: Date | null;
  // ID do signatário no D4Sign (`key_signer`) — confirmado ao vivo que
  // vem pra TODO destinatário, mesmo quem ainda não assinou.
  keySigner: string | null;
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
  // Destinatários cadastrados no documento, com status de assinatura em
  // melhor esforço — usado tanto pra validar que o ID colado corresponde à
  // agência certa (registro de contrato externo) quanto pelo sync manual
  // com o D4Sign (SincronizarContratoD4SignUseCase).
  obterDestinatarios(provedorId: string): Promise<DestinatarioD4Sign[]>;
  // Registra nosso endpoint de webhook num documento que não passou por
  // gerarEEnviar (ex.: contrato assinado por fora, registrado depois).
  // `registrado: false` quando D4SIGN_WEBHOOK_URL não está configurada —
  // diferente de gerarEEnviar (que pula em silêncio), aqui o caller
  // precisa saber pra avisar o analista.
  registrarWebhook(provedorId: string): Promise<{ registrado: boolean }>;
  // Cancela o documento no D4Sign — usado por CancelarContratoUseCase
  // quando o analista cancela um contrato ainda em Assinatura/Validação.
  cancelarDocumento(provedorId: string, motivo: string): Promise<void>;
  // Link direto de assinatura de UM destinatário (botão "Ver/copiar link"
  // na Fila de Assinatura do dossiê) — `keySigner` é o valor bruto salvo em
  // ContratoAssinatura (base64, confirmado ao vivo — ver D4SignAdapter).
  // Lança se o D4Sign não devolver um link (ex.: documento ainda não foi
  // enviado pra esse signatário — estágios posteriores só são notificados
  // depois que o(s) estágio(s) anterior(es) assinar(em), ver workflow="1"
  // em cadastrarSignatarios).
  obterLinkAssinatura(provedorId: string, keySigner: string): Promise<string>;
}
