import type { Cargo } from "@/modules/users/domain/enums";

export interface UserView {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  createdAt: string;
}

export interface CreateUserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  password: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

// Payload de fato enviado à API — password é omitido (não vazio) quando
// useTemporaryPassword é true, pra bater com a validação opcional do zod
// (create-user.schema.ts trata "" como inválido, só undefined é opcional).
export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  password?: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

export interface CreatedUserResult {
  user: UserView;
  temporaryPassword?: string;
}
