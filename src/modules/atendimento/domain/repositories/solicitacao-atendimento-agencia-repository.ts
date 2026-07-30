import type { SolicitacaoAtendimentoAgenciaEntity } from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";

export interface CriarSolicitacaoAtendimentoAgenciaData {
  agenciaId: string;
  tipo: "transferencia" | "assuncao";
  solicitanteId: string;
  atendenteAtualId: string;
  novoAtendenteId: string;
}

export type DecisaoSolicitacaoAtendimentoAgencia = "ACEITAR" | "CANCELAR";

export interface SolicitacaoAtendimentoAgenciaRepository {
  criar(data: CriarSolicitacaoAtendimentoAgenciaData): Promise<SolicitacaoAtendimentoAgenciaEntity>;
  // A pendente da agência — auto-expira-e-efetiva antes de responder (ver
  // PrismaSolicitacaoAtendimentoAgenciaRepository), então devolve null se
  // já não está mais pendente.
  findPendentePorAgencia(agenciaId: string): Promise<SolicitacaoAtendimentoAgenciaEntity | null>;
  // Pendentes que envolvem esse usuário (solicitante, atendente atual ou
  // novo atendente), já expiradas-e-efetivadas se vencidas.
  findPendentesEnvolvendoUsuario(userId: string): Promise<SolicitacaoAtendimentoAgenciaEntity[]>;
  findById(id: string): Promise<SolicitacaoAtendimentoAgenciaEntity | null>;
  // Claim atômico + efetivação (se ACEITAR). Idempotente: se outra chamada
  // já resolveu, devolve o estado atual sem reaplicar o efeito; cancelar
  // algo que já foi aceito lança ConflictError.
  resolver(
    id: string,
    decisao: DecisaoSolicitacaoAtendimentoAgencia,
  ): Promise<SolicitacaoAtendimentoAgenciaEntity>;
  // Usado pelo Encerrar atendimento — cancela sem efetivar (não aplica o
  // efeito de troca), pra não deixar pendência "pairando" sobre um
  // atendimento que já foi encerrado por outro caminho.
  cancelarPendentesPorAgencia(agenciaId: string): Promise<void>;
  // Best-effort — chamado a partir de pontos de leitura já existentes (ver
  // atendimento.controller.ts) pra fechar a lacuna de "ninguém leu essa
  // solicitação depois que o prazo passou". Nunca lança.
  expirarPendentesVencidas(agenciaIds: string[]): Promise<void>;
}
