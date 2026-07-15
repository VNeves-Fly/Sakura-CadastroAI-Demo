import { signIn, signOut, type SignInResponse } from "next-auth/react";

// Única camada autorizada a se comunicar com a API externa (NextAuth).
// ViewModels e Adapters nunca importam "next-auth/react" diretamente.
export const authService = {
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<SignInResponse | undefined> {
    return signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    });
  },

  async logout(): Promise<void> {
    await signOut({ redirect: false });
  },
};
