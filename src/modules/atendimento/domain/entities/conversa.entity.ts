import type { MensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";

export type TipoContatoConversaEntity = "agencia" | "nao_identificado";
export type PapelMembroEntity = "socio" | "representante_legal" | "comercial" | "outro";

export interface MembroConversaEntity {
  id: string;
  nome: string;
  papel: PapelMembroEntity;
  telefone: string;
}

// Atendimento é sempre da AGÊNCIA (AtendimentoAgencia), não da conversa —
// duas conversas da mesma agência compartilham o mesmo atendimentoAtual/
// historicoAtendimento. Null (e histórico vazio) pra conversa "não
// identificada" (sem agenciaId, sem conceito de atendimento).
export interface AtendimentoAtualEntity {
  analistaId: string;
  analistaNome: string;
  assumidoEm: string;
  liberadoEm: string | null;
}

export interface DocumentoParaRevisarEntity {
  id: string;
  tipo: string;
  status: "PENDENTE" | "REPROVADO";
  nomeSocio: string | null;
  motivoReprovacao: string | null;
}

export interface ResumoFichaClienteEntity {
  statusAgencia: "ativo" | "recusado" | "em_andamento";
  documentosAprovados: number;
  documentosPendentes: number;
  // Documento atual (por slot tipo+representanteLegalId, já sem versões
  // antigas superadas por reenvio) que ainda precisa de ação — pendente
  // de decisão ou já reprovado — usado pra flagar e mandar link de
  // reenvio direto do chat (ver PainelInformacoes).
  documentosParaRevisar: DocumentoParaRevisarEntity[];
  situacaoCadastralReceita: string | null;
  contratoStatus: string | null;
  amatSofiaConsultado: boolean;
}

export interface ConversaEntity {
  id: string;
  tipoContato: TipoContatoConversaEntity;
  agenciaId: string | null;
  agenciaNome: string;
  agenciaCnpj: string;
  membro: MembroConversaEntity;
  mensagens: MensagemEntity[];
  atendimentoAtual: AtendimentoAtualEntity | null;
  historicoAtendimento: AtendimentoAtualEntity[];
  resumoFicha: ResumoFichaClienteEntity;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
}
