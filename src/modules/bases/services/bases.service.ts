import type { BasePayload } from "@/modules/bases/types/base.types";

export interface RawBaseResponse {
  id: string;
  sigla: string;
  nomeCidade: string;
  uf: string;
  createdAt: string;
}

export const basesService = {
  async list(): Promise<RawBaseResponse[]> {
    const response = await fetch("/api/bases", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Não foi possível carregar as bases.");
    }
    return response.json();
  },

  async getById(id: string): Promise<RawBaseResponse> {
    const response = await fetch(`/api/bases/${id}`, { cache: "no-store" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível carregar a base.");
    }
    return response.json();
  },

  async create(input: BasePayload): Promise<RawBaseResponse> {
    const response = await fetch("/api/bases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível criar a base.");
    }
    return response.json();
  },

  async update(id: string, input: BasePayload): Promise<RawBaseResponse> {
    const response = await fetch(`/api/bases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível atualizar a base.");
    }
    return response.json();
  },
};
