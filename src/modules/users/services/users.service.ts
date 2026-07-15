import type { CreateUserFormValues } from "@/modules/users/types/user.types";

export interface RawUserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Única camada autorizada a se comunicar com a API externa (rotas /api/users).
export const usersService = {
  async list(): Promise<RawUserResponse[]> {
    const response = await fetch("/api/users", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Não foi possível carregar os usuários.");
    }

    return response.json();
  },

  async create(input: CreateUserFormValues): Promise<RawUserResponse> {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível criar o usuário.");
    }

    return response.json();
  },
};
