import type { Cargo } from "@/modules/users/domain/enums";

export interface UpdateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  ativo: boolean;
}
