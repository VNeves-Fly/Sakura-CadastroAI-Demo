import type { RawUserResponse } from "@/modules/users/services/users.service";
import type {
  CreateUserFormValues,
  CreateUserPayload,
  UpdateUserFormValues,
  UserView,
} from "@/modules/users/types/user.types";

// Traduz a forma de dados da API (RawUserResponse) para a forma consumida
// pela View/ViewModel (UserView), isolando o restante do módulo do
// formato exato da resposta HTTP.
export const usersAdapter = {
  // Sempre gera senha temporária + dispara e-mail de boas-vindas — o form
  // não tem mais campo de senha (ver CreateUserFormValues), então esses
  // dois flags ficam fixos aqui em vez de vir do usuário.
  toServiceInput(values: CreateUserFormValues): CreateUserPayload {
    return {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      cargo: values.cargo,
      mustChangePassword: true,
      useTemporaryPassword: true,
      ativo: values.ativo,
    };
  },

  toUpdateServiceInput(values: UpdateUserFormValues) {
    return {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      cargo: values.cargo,
      ativo: values.ativo,
    };
  },

  toView(raw: RawUserResponse): UserView {
    return {
      id: raw.id,
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      phone: raw.phone,
      cargo: raw.cargo,
      ativo: raw.ativo,
      lastLoginAt: raw.lastLoginAt,
      createdAt: raw.createdAt,
    };
  },

  toViewList(raw: RawUserResponse[]): UserView[] {
    return raw.map((item) => usersAdapter.toView(item));
  },
};
