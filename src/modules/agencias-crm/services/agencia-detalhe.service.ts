import type { AgenciaDetalheView } from "@/modules/agencias-crm/types/agencia-detalhe.types";

// Única camada autorizada a se comunicar com a API externa
// (/api/agencias-crm/:id) — mesmo padrão de gestores.service.ts.
export const agenciaDetalheService = {
  async buscar(id: string): Promise<AgenciaDetalheView> {
    const response = await fetch(`/api/agencias-crm/${id}`, { cache: "no-store" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Não foi possível carregar a agência.");
    }
    return response.json();
  },
};
