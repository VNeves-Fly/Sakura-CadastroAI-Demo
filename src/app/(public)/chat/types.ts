export interface SocioChat {
  nome: string;
  cpf: string;
  telefone: string;
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
  | "telefone"
  | "email"
  | "escolha_socio"
  | "estado_civil"
  | "endereco_socio"
  | "documento_socio"
  | "endereco_mesmo_socio"
  | "endereco_qual_socio"
  | "endereco_agencia"
  | "dados_bancarios"
  | "contrato_social"
  | "confirmar_envio"
  | "reiniciar";

export type PendingInput =
  | { kind: "texto"; tag: PendingTag; placeholder: string }
  | { kind: "quick-replies"; tag: PendingTag; opcoes: { valor: string; label: string }[] }
  | { kind: "inline-form"; tag: PendingTag; titulo: string; campos: CampoInlineForm[] }
  | { kind: "arquivo"; tag: PendingTag; instrucao: string };
