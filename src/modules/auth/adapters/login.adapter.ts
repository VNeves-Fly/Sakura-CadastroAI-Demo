import type { SignInResponse } from "next-auth/react";
import type { LoginFormValues, LoginResult } from "@/modules/auth/types/login.types";

// Traduz dados entre a forma que a View/ViewModel usam e a forma que o
// Service/API externa esperam, isolando o ViewModel de detalhes do NextAuth.
export const loginAdapter = {
  toServiceInput(values: LoginFormValues): { email: string; password: string } {
    return {
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };
  },

  fromServiceResult(result: SignInResponse | undefined): LoginResult {
    if (!result) {
      return { success: false, error: "Erro inesperado ao autenticar." };
    }

    if (result.error) {
      return { success: false, error: "E-mail ou senha inválidos." };
    }

    return { success: true };
  },
};
