export interface CreatePromotorInput {
  nome: string;
  sica: number | null;
  email: string;
  telefone: string | null;
  gestorId: string;
  bases: string[];
  criarAcesso: boolean;
  password?: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

export interface PromotorOutput {
  id: string;
  nome: string;
  sica: number | null;
  email: string;
  telefone: string | null;
  gestorId: string | null;
  bases: string[];
  userId: string | null;
  temporaryPassword?: string;
}
