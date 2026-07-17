import type { RawUserResponse } from "@/modules/users/services/users.service";
import type { CreateUserFormValues, UserView } from "@/modules/users/types/user.types";

// Traduz a forma de dados da API (RawUserResponse) para a forma consumida
// pela View/ViewModel (UserView), isolando o restante do módulo do
// formato exato da resposta HTTP.
export const usersAdapter = {
  toServiceInput(values: CreateUserFormValues): CreateUserFormValues {
    return {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };
  },

  toView(raw: RawUserResponse): UserView {
    return {
      id: raw.id,
      name: raw.name,
      email: raw.email,
      createdAt: raw.createdAt,
    };
  },

  toViewList(raw: RawUserResponse[]): UserView[] {
    return raw.map((item) => usersAdapter.toView(item));
  },
};
