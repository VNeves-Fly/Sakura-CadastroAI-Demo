import type { ContratoSocialAnaliseView } from "@/modules/cadastro/types/agencia.types";

export interface TelefoneChat {
  tipo: "fixo" | "celular";
  numero: string;
  whatsapp: boolean | null;
}

// Endereço já resolvido (via CEP real ou digitado manualmente quando o
// CEP não é encontrado) — guarda os campos estruturados (pro FormData
// final, mesmo shape de SocioWizardFormValues/EnderecoBancoFormValues) e
// um resumo pronto pra exibir/confirmar na conversa.
export interface EnderecoResolvidoChat {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  resumo: string;
}

// Representante legal (procurador) não é mais uma pessoa separada — o
// backend só entende como um sócio marcado com isRepresentante (mesma
// regra do /cadastro, ver socio-wizard-card.tsx). Os dados de identidade,
// endereço e RG já existem no próprio sócio; só falta a procuração.
export interface SocioChat {
  nome: string;
  cpf: string;
  email: string;
  telefone: TelefoneChat | null;
  estadoCivil: string;
  estadoCivilLabel: string;
  // Extraídos da análise real do RG/CNH (analisarDocumentoIdentificacao) —
  // nunca perguntados diretamente, mesmo padrão de autopreenchimento do
  // /cadastro. Divergência com o que o sócio já digitou não é mostrada.
  dataNascimento: string | null;
  rg: string | null;
  rgOrgaoEmissor: string | null;
  rgUf: string | null;
  rgArquivo: File | null;
  documentoNome: string | null;
  endereco: EnderecoResolvidoChat | null;
  isRepresentante: boolean;
  procuracaoArquivo: File | null;
  procuracaoArquivoNome: string | null;
}

export interface BancoChat {
  banco: string;
  codigo: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  tipoContaLabel: string;
  favorecidoEhEmpresa: boolean;
}

export interface ContextoChat {
  cnpj: string;
  razaoSocial: string;
  contratoSocial: File | null;
  contratoSocialNome: string | null;
  contratoSocialAnalise: ContratoSocialAnaliseView | null;
  telefoneComercial: TelefoneChat | null;
  emailContato: string;
  emailComercialDiferente: boolean;
  emailComercial: string | null;
  emailFinanceiroDiferente: boolean;
  emailFinanceiro: string | null;
  socios: SocioChat[];
  socioAtualIndex: number | null;
  temProcurador: boolean | null;
  enderecoSocioPendente: EnderecoResolvidoChat | null;
  enderecoAgenciaPendente: EnderecoResolvidoChat | null;
  enderecoAgencia: EnderecoResolvidoChat | null;
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
  | "nome_socio_manual"
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
  | "escolha_socio_procurador"
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
  tipo: "aprovado" | "manual" | "duplicado";
  titulo: string;
  mensagem: string;
}
