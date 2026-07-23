export type StatusSolicitacaoTransferenciaEntity = "pendente" | "aceita" | "recusada" | "expirada";

// Nomes de exibição já resolvidos (User.name) — nunca ids crus, pra bater
// 1:1 com o que o front espera renderizar direto.
export interface SolicitacaoTransferenciaEntity {
  id: string;
  conversaId: string;
  deAnalista: string;
  paraAnalista: string;
  status: StatusSolicitacaoTransferenciaEntity;
  criadaEm: string;
}
