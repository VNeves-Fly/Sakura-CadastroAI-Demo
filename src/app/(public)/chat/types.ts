export interface TelefoneChat {
  tipo: "fixo" | "celular";
  numero: string;
  whatsapp: boolean | null;
}

export interface PessoaChat {
  nome: string;
  cpf: string;
  email: string;
  telefone: TelefoneChat | null;
  enderecoResumo: string | null;
}

export interface SocioChat extends PessoaChat {
  estadoCivil: string;
  estadoCivilLabel: string;
  documentoNome: string | null;
}

export interface ProcuradorChat extends PessoaChat {
  rgArquivoNome: string | null;
  procuracaoArquivoNome: string | null;
}

export interface BancoChat {
  banco: string;
  agencia: string;
  conta: string;
  tipoContaLabel: string;
  favorecidoEhEmpresa: boolean;
}

export interface ContextoChat {
  cnpj: string;
  razaoSocial: string;
  contratoSocialNome: string | null;
  telefoneComercial: TelefoneChat | null;
  emailContato: string;
  emailComercialDiferente: boolean;
  emailComercial: string | null;
  emailFinanceiroDiferente: boolean;
  emailFinanceiro: string | null;
  socios: SocioChat[];
  socioAtualIndex: number | null;
  temProcurador: boolean | null;
  procurador: ProcuradorChat | null;
  enderecoSocioPendente: string | null;
  enderecoProcuradorPendente: string | null;
  enderecoAgenciaPendente: string | null;
  enderecoAgenciaResumo: string | null;
  banco: BancoChat | null;
}

export type ChatMessage =
  | { id: string; autor: "bot"; tipo: "loading" }
  | { id: string; autor: "bot"; tipo: "texto"; conteudo: string }
  | { id: string; autor: "bot"; tipo: "resumo"; itens: string[] }
  | { id: string; autor: "user"; tipo: "texto"; conteudo: string }
  | { id: string; autor: "user"; tipo: "arquivo"; nomeArquivo: string };

export interface CampoInlineForm {
  nome: string;
  label: string;
  tipo: "text" | "select" | "checkbox";
  opcoes?: { valor: string; label: string }[];
  placeholder?: string;
  obrigatorio?: boolean;
}

export type PendingTag =
  | "escolha_modo_inicial"
  | "whatsapp_fallback"
  | "cnpj"
  | "contrato_social_empresa"
  | "telefone_comercial_pergunta"
  | "tipo_telefone"
  | "telefone_celular"
  | "telefone_fixo"
  | "confirma_whatsapp"
  | "email_contato"
  | "email_flags"
  | "email_comercial"
  | "email_financeiro"
  | "escolha_socio"
  | "cpf"
  | "email"
  | "estado_civil"
  | "endereco_socio"
  | "confirmar_endereco_socio"
  | "documento_socio"
  | "tem_procurador"
  | "procurador_nome"
  | "cpf_procurador"
  | "email_procurador"
  | "endereco_procurador"
  | "confirmar_endereco_procurador"
  | "documento_rg_procurador"
  | "documento_procuracao"
  | "endereco_mesmo_socio"
  | "endereco_qual_socio"
  | "endereco_agencia"
  | "confirmar_endereco_agencia"
  | "dados_bancarios"
  | "confirmar_envio";

export type PendingInput =
  | { kind: "texto"; tag: PendingTag; placeholder: string }
  | { kind: "quick-replies"; tag: PendingTag; opcoes: { valor: string; label: string }[] }
  | { kind: "inline-form"; tag: PendingTag; titulo: string; campos: CampoInlineForm[] }
  | { kind: "arquivo"; tag: PendingTag; instrucao: string };

export type FaseChat = "chat" | "analisando" | "resultado";

export interface ResultadoFinalChat {
  tipo: "aprovado" | "manual";
  titulo: string;
  mensagem: string;
}
