export interface UpdatePromotorInput {
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
