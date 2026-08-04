export interface CreateGestorInput {
  nome: string;
  email: string | null;
  telefone: string | null;
  bases: string[];
  criarAcesso: boolean;
  password?: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

export interface GestorOutput {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  userId: string | null;
  bases: string[];
  createdAt: string;
  updatedAt: string;
  temporaryPassword?: string;
}
