export interface GestorView {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  temAcesso: boolean;
  bases: string[];
  createdAt: string;
}

export interface GestorFormValues {
  nome: string;
  email: string;
  telefone: string;
  baseIds: string[];
  criarAcesso: boolean;
  password: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

export interface GestorPayload {
  nome: string;
  email: string | null;
  telefone: string | null;
  baseIds: string[];
  criarAcesso: boolean;
  password?: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

export interface CreatedGestorResult {
  gestor: GestorView;
  temporaryPassword?: string;
}
