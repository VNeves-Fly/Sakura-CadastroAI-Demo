import type { MensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";
import type { SolicitacaoTransferenciaEntity } from "@/modules/atendimento/domain/entities/solicitacao-transferencia.entity";

export type TipoContatoConversaEntity = "agencia" | "nao_identificado";
export type PapelMembroEntity = "socio" | "representante_legal" | "comercial" | "outro";

export interface MembroConversaEntity {
  id: string;
  nome: string;
  papel: PapelMembroEntity;
  telefone: string;
}

export interface AssumirAtendimentoRegistroEntity {
  analistaNome: string;
  assumidoEm: string;
  liberadoEm: string | null;
}

export interface ResumoFichaClienteEntity {
  statusAgencia: "ativo" | "recusado" | "em_andamento";
  documentosAprovados: number;
  documentosPendentes: number;
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
  atendimentoAtual: AssumirAtendimentoRegistroEntity | null;
  historicoAtendimento: AssumirAtendimentoRegistroEntity[];
  solicitacaoTransferenciaPendente: SolicitacaoTransferenciaEntity | null;
  resumoFicha: ResumoFichaClienteEntity;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
}
