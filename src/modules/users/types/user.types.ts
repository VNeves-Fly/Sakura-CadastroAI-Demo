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

export interface CreatedUserResult {
  user: UserView;
  temporaryPassword?: string;
}
