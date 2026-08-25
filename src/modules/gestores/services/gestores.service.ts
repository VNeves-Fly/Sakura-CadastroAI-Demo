import type { GestorPayload } from "@/modules/gestores/types/gestor.types";

export interface RawGestorResponse {
  id: string;
  nome: string;
  sica: number | null;
  email: string | null;
  telefone: string | null;
  userId: string | null;
  bases: string[];
  createdAt: string;
  updatedAt: string;
  temporaryPassword?: string;
}

// Única camada autorizada a se comunicar com a API externa (rotas /api/gestores).
export const gestoresService = {
  async list(): Promise<RawGestorResponse[]> {
    const response = await fetch("/api/gestores", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Não foi possível carregar os gestores.");
    }
    return response.json();
  },

  async getById(id: string): Promise<RawGestorResponse> {
    const response = await fetch(`/api/gestores/${id}`, { cache: "no-store" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível carregar o gestor.");
    }
    return response.json();
  },

  async create(input: GestorPayload): Promise<RawGestorResponse> {
    const response = await fetch("/api/gestores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível criar o gestor.");
    }
    return response.json();
  },

  async update(id: string, input: GestorPayload): Promise<RawGestorResponse> {
    const response = await fetch(`/api/gestores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível atualizar o gestor.");
    }
    return response.json();
  },
};
