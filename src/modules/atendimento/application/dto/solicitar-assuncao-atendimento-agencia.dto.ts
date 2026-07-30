export interface SolicitarAssuncaoAtendimentoAgenciaInput {
  agenciaId: string;
  // Sempre resolvido a partir da sessão do analista na rota — sem destino
  // escolhido, o "destino" é sempre quem está atendendo agora (ver
  // SolicitarAssuncaoAtendimentoAgenciaUseCase).
  solicitanteId: string;
}
