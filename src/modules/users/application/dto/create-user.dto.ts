import type { Cargo } from "@/modules/users/domain/enums";

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  password?: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
  ativo: boolean;
}

export interface UserOutput {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  mustChangePassword: boolean;
  ativo: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Só preenchido quando mustChangePassword e/ou useTemporaryPassword foram
  // marcados na criação — é a única vez que a senha em texto puro aparece
  // na resposta, pro admin poder repassar pro usuário.
  temporaryPassword?: string;
}
