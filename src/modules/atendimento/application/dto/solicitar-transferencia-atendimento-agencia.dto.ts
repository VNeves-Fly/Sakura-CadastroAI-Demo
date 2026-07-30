export interface SolicitarTransferenciaAtendimentoAgenciaInput {
  agenciaId: string;
  // Sempre resolvido a partir da sessão do analista na rota.
  deAnalistaId: string;
  // Validado contra a tabela User na use-case (NotFoundError se não existir).
  paraAnalistaId: string;
}
