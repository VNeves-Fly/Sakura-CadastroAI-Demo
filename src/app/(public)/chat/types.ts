export interface TelefoneChat {
  tipo: "fixo" | "celular";
  numero: string;
  whatsapp: boolean | null;
}

export interface SocioChat {
  nome: string;
  cpf: string;
  telefones: TelefoneChat[];
  email: string;
  estadoCivil: string;
  estadoCivilLabel: string;
  enderecoResumo: string | null;
  documentoNome: string | null;
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
  socios: SocioChat[];
  socioAtualIndex: number | null;
  enderecoSocioPendente: string | null;
  enderecoAgenciaPendente: string | null;
  enderecoAgenciaResumo: string | null;
  banco: BancoChat | null;
  contratoSocialNome: string | null;
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
  | "cnpj"
  | "cpf"
  | "tipo_telefone"
  | "telefone_celular"
  | "telefone_fixo"
  | "confirma_whatsapp"
  | "mais_telefone"
  | "email"
  | "escolha_socio"
  | "estado_civil"
  | "endereco_socio"
  | "confirmar_endereco_socio"
  | "documento_socio"
  | "endereco_mesmo_socio"
  | "endereco_qual_socio"
  | "endereco_agencia"
  | "confirmar_endereco_agencia"
  | "dados_bancarios"
  | "contrato_social"
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
