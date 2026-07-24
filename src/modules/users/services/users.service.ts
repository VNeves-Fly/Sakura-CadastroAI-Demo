import type { Cargo } from "@/modules/users/domain/enums";
import type { CreateUserPayload } from "@/modules/users/types/user.types";

export interface RawUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cargo: Cargo;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  temporaryPassword?: string;
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

  async create(input: CreateUserPayload): Promise<RawUserResponse> {
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

  async requestPasswordReset(userId: string): Promise<void> {
    const response = await fetch(`/api/users/${userId}/recuperar-senha`, {
      method: "POST",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível enviar o e-mail de recuperação.");
    }
  },
};
