// Tipos do módulo Atendimento — já batem 1:1 com o que a API real devolve
// (ver services/atendimento-api.ts, application/dto e domain/entities do
// backend em src/modules/atendimento/{application,domain}).

export type PapelMembro = "socio" | "representante_legal" | "comercial" | "outro";

export interface MembroAgencia {
  id: string;
  nome: string;
  papel: PapelMembro;
  telefone: string;
}

export type TipoMensagem = "texto" | "audio" | "imagem" | "pdf";
export type AutorMensagem = "cliente" | "analista";

export interface Mensagem {
  id: string;
  conversaId: string;
  autor: AutorMensagem;
  analistaNome?: string;
  tipo: TipoMensagem;
  conteudo: string;
  // Só usado quando tipo === "audio" (duração em segundos) — mock.
  duracaoSegundos?: number;
  // Só usado quando tipo === "pdf" (tamanho exibido) — mock.
  tamanhoArquivo?: string;
  lido: boolean;
  createdAt: string; // ISO string no front
}

export interface AssumirAtendimentoRegistro {
  analistaNome: string;
  assumidoEm: string; // ISO string no front
  liberadoEm: string | null;
}

// Resumo da ficha do cliente mostrado na coluna de informações — reflete
// o mesmo tipo de dado já mostrado no dossiê real (/painel, /arquivo),
// só que aqui é gerado junto com o resto do mock do atendimento.
export interface ResumoFichaCliente {
  statusAgencia: "ativo" | "recusado" | "em_andamento";
  documentosAprovados: number;
  documentosPendentes: number;
  situacaoCadastralReceita: string | null;
  contratoStatus: string | null;
  amatSofiaConsultado: boolean;
}

export type TipoContatoConversa = "agencia" | "nao_identificado";

export interface Conversa {
  id: string;
  // null quando tipoContato === "nao_identificado" (número não bate com
  // nenhum sócio/representante/telefone de agência cadastrada).
  agenciaId: string | null;
  tipoContato: TipoContatoConversa;
  agenciaNome: string;
  agenciaCnpj: string;
  membro: MembroAgencia;
  mensagens: Mensagem[];
  atendimentoAtual: AssumirAtendimentoRegistro | null;
  historicoAtendimento: AssumirAtendimentoRegistro[];
  resumoFicha: ResumoFichaCliente;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
}

export interface TextoPronto {
  id: string;
  titulo: string;
  conteudo: string;
}

export interface TemplateAprovado {
  id: string;
  nome: string;
  conteudo: string;
}

// ---- Inputs (equivalentes aos DTOs do back-end) ----

export interface EnviarMensagemInput {
  tipo: TipoMensagem;
  conteudo: string;
  duracaoSegundos?: number;
  tamanhoArquivo?: string;
}

export interface AssumirAtendimentoInput {
  analistaNome: string;
}

export interface CriarTextoProntoInput {
  titulo: string;
  conteudo: string;
}
