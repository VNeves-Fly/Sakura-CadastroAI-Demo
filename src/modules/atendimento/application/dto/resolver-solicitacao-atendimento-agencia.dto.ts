// Compartilhado por Confirmar e Cancelar — mesmo shape, use-case diferente
// (ConfirmarSolicitacaoAtendimentoAgenciaUseCase /
// CancelarSolicitacaoAtendimentoAgenciaUseCase).
export interface ResolverSolicitacaoAtendimentoAgenciaInput {
  solicitacaoId: string;
  // Sempre resolvido a partir da sessão do analista na rota.
  analistaId: string;
}
