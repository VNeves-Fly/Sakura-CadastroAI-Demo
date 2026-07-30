// Tipos do atendimento do CADASTRO (SolicitacaoAtendimentoAgencia) — já
// batem 1:1 com o que a API real devolve (ver
// services/atendimento-agencia-api.ts e o `paraView` em
// atendimento-agencia.routes.ts no backend). Distinto de atendimento.types.ts,
// que é do chat/Conversa.

export type TipoSolicitacaoAtendimentoAgencia = "transferencia" | "assuncao";
export type StatusSolicitacaoAtendimentoAgencia = "pendente" | "aceita" | "cancelada";
export type PapelSolicitacaoAtendimentoAgencia = "solicitante" | "destinatario" | null;

// Retorno de Iniciar/Encerrar (POST .../iniciar, .../encerrar) — mesmo
// formato de RegistroAtendimentoAgenciaAtual no backend.
export interface AtendimentoAgenciaAtual {
  id: string;
  analistaId: string;
  analistaNome: string;
  assumidoEm: string;
}

export interface SolicitacaoAtendimentoAgencia {
  id: string;
  agenciaId: string;
  agenciaNome: string;
  tipo: TipoSolicitacaoAtendimentoAgencia;
  solicitanteId: string;
  solicitanteNome: string;
  atendenteAtualId: string;
  atendenteAtualNome: string;
  novoAtendenteId: string;
  novoAtendenteNome: string;
  status: StatusSolicitacaoAtendimentoAgencia;
  criadaEm: string;
  // Já resolvido pelo backend (ver papelNaSolicitacao) — o front nunca
  // recalcula sozinho quem é solicitante/destinatário.
  meuPapel: PapelSolicitacaoAtendimentoAgencia;
}
