import type { PromotorPayload } from "@/modules/atribuicoes/types/promotor-crud.types";

export interface RawPromotorResponse {
  id: string;
  nome: string;
  sica: number | null;
  email: string;
  telefone: string | null;
  gestorId: string | null;
  bases: string[];
  userId: string | null;
  temporaryPassword?: string;
  // Só vem em GET /api/promotores (listagem) — ver comVendasReais em
  // promotores.routes.ts.
  vendasMes?: number;
  vendasAno?: number;
}

// Única camada autorizada a se comunicar com a API externa (rotas
// /api/promotores) — não confundir com PromotorRepository (server-side).
export const promotoresCrudService = {
  async list(): Promise<RawPromotorResponse[]> {
    const response = await fetch("/api/promotores", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Não foi possível carregar os executivos.");
    }
    return response.json();
  },

  async getById(id: string): Promise<RawPromotorResponse> {
    const response = await fetch(`/api/promotores/${id}`, { cache: "no-store" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível carregar o executivo.");
    }
    return response.json();
  },

  async create(input: PromotorPayload): Promise<RawPromotorResponse> {
    const response = await fetch("/api/promotores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível criar o executivo.");
    }
    return response.json();
  },

  async update(id: string, input: PromotorPayload): Promise<RawPromotorResponse> {
    const response = await fetch(`/api/promotores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível atualizar o executivo.");
    }
    return response.json();
  },
};
