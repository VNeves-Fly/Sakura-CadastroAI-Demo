import type { Cargo } from "@/modules/users/domain/enums";

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export interface AuthenticateUserOutput {
  id: string;
  name: string;
  email: string;
  mustChangePassword: boolean;
  cargo: Cargo;
}
