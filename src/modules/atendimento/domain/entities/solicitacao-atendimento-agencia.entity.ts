export type TipoSolicitacaoAtendimentoAgenciaEntity = "transferencia" | "assuncao";
export type StatusSolicitacaoAtendimentoAgenciaEntity = "pendente" | "aceita" | "cancelada";

// Nomes de exibição já resolvidos (User.name) — nunca ids crus, pra bater
// 1:1 com o que o front espera renderizar direto (mesmo padrão de
// SolicitacaoTransferenciaEntity). Os ids ficam também porque a rota SSE
// precisa deles pra decidir quem recebe o evento (ver papelNaSolicitacao).
export interface SolicitacaoAtendimentoAgenciaEntity {
  id: string;
  agenciaId: string;
  agenciaNome: string;
  tipo: TipoSolicitacaoAtendimentoAgenciaEntity;
  solicitanteId: string;
  solicitanteNome: string;
  atendenteAtualId: string;
  atendenteAtualNome: string;
  novoAtendenteId: string;
  novoAtendenteNome: string;
  status: StatusSolicitacaoAtendimentoAgenciaEntity;
  criadaEm: string;
}

export type PapelSolicitacaoAtendimentoAgencia = "solicitante" | "destinatario" | null;

type CamposPapel = Pick<
  SolicitacaoAtendimentoAgenciaEntity,
  "tipo" | "solicitanteId" | "atendenteAtualId" | "novoAtendenteId"
>;

// Único lugar que decide "quem é o quê" numa solicitação — rota SSE, hook
// de ação e componente de toast todos chamam isto em vez de reimplementar a
// conta, pra nunca arriscar inverter os polos entre TRANSFERENCIA e
// ASSUNCAO (ver comentário no schema.prisma sobre atendenteAtualId/
// novoAtendenteId). O destinatário (quem PRECISA agir pra confirmar) é
// sempre o lado que não é o solicitante — na TRANSFERENCIA é
// novoAtendenteId (quem vai receber o atendimento), na ASSUNCAO é
// atendenteAtualId (quem está atendendo agora e pode perder pra quem pediu).
export function papelNaSolicitacao(
  solicitacao: CamposPapel,
  userId: string,
): PapelSolicitacaoAtendimentoAgencia {
  if (solicitacao.solicitanteId === userId) return "solicitante";
  if (solicitacao.tipo === "transferencia" && solicitacao.novoAtendenteId === userId) {
    return "destinatario";
  }
  if (solicitacao.tipo === "assuncao" && solicitacao.atendenteAtualId === userId) {
    return "destinatario";
  }
  return null;
}

// Só o destinatário confirma — em ambos os tipos.
export function podeConfirmar(solicitacao: CamposPapel, userId: string): boolean {
  return papelNaSolicitacao(solicitacao, userId) === "destinatario";
}

// O solicitante sempre pode cancelar o próprio pedido. Na ASSUNCAO, quem
// está atendendo agora (destinatário) também pode cancelar (recusar ficar
// sem o atendimento) — na TRANSFERENCIA o destinatário só tem Confirmar,
// não Cancelar (só quem transfere pode desistir).
export function podeCancelar(solicitacao: CamposPapel, userId: string): boolean {
  const papel = papelNaSolicitacao(solicitacao, userId);
  if (papel === "solicitante") return true;
  return papel === "destinatario" && solicitacao.tipo === "assuncao";
}
