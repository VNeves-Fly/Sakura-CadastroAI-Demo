import type { RawUserResponse } from "@/modules/users/services/users.service";
import type {
  CreatedUserResult,
  CreateUserFormValues,
  UserView,
} from "@/modules/users/types/user.types";

// Traduz a forma de dados da API (RawUserResponse) para a forma consumida
// pela View/ViewModel (UserView), isolando o restante do módulo do
// formato exato da resposta HTTP.
export const usersAdapter = {
  toServiceInput(values: CreateUserFormValues): CreateUserFormValues {
    return {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      cargo: values.cargo,
      password: values.password,
      mustChangePassword: values.mustChangePassword,
      useTemporaryPassword: values.useTemporaryPassword,
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
      createdAt: raw.createdAt,
    };
  },

  toViewList(raw: RawUserResponse[]): UserView[] {
    return raw.map((item) => usersAdapter.toView(item));
  },

  toCreatedResult(raw: RawUserResponse): CreatedUserResult {
    return {
      user: usersAdapter.toView(raw),
      temporaryPassword: raw.temporaryPassword,
    };
  },
};
