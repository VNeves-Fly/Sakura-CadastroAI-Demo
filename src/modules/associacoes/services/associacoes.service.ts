import type { AssociacaoPayload } from "@/modules/associacoes/types/associacao.types";

export interface RawAssociacaoResponse {
  id: string;
  nome: string;
  ativo: boolean;
}

export const associacoesService = {
  async list(): Promise<RawAssociacaoResponse[]> {
    const response = await fetch("/api/associacoes", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Não foi possível carregar as associações.");
    }
    return response.json();
  },

  async getById(id: string): Promise<RawAssociacaoResponse> {
    const response = await fetch(`/api/associacoes/${id}`, { cache: "no-store" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível carregar a associação.");
    }
    return response.json();
  },

  async create(input: AssociacaoPayload): Promise<RawAssociacaoResponse> {
    const response = await fetch("/api/associacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível criar a associação.");
    }
    return response.json();
  },

  async update(id: string, input: AssociacaoPayload): Promise<RawAssociacaoResponse> {
    const response = await fetch(`/api/associacoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível atualizar a associação.");
    }
    return response.json();
  },
};
