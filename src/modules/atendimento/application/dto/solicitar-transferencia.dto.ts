export interface SolicitarTransferenciaInput {
  conversaId: string;
  // Sempre resolvido a partir da sessão do analista na rota.
  deAnalistaId: string;
  // `paraAnalista` no body do front vira o id do analista alvo — validado
  // contra a tabela User na use-case (NotFoundError se não existir).
  paraAnalistaId: string;
}
