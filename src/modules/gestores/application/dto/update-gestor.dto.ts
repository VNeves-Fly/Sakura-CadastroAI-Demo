export interface UpdateGestorInput {
  nome: string;
  sica: number | null;
  email: string | null;
  telefone: string | null;
  baseIds: string[];
  // Só tem efeito se o Gestor ainda não tiver acesso (userId null) — ver
  // update-gestor.use-case.ts.
  criarAcesso: boolean;
  password?: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}
