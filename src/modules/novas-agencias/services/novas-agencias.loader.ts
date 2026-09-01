import { IDENTIDADES_AGENCIAS_COMPARTILHADAS } from "@/modules/crm-mock/agencias.mock-data";
import { montarNovasAgenciasView } from "@/modules/novas-agencias/adapters/novas-agencias.adapter";
import type { NovasAgenciasData } from "@/modules/novas-agencias/types/novas-agencias.types";

// Demo 100% mock: nenhuma chamada a Prisma/SST. As agências novas vêm do
// mesmo subconjunto fictício compartilhado usado por /crm/agencias
// (IDENTIDADES_AGENCIAS_COMPARTILHADAS), garantindo que os ids/nomes
// convirjam entre as telas de CRM.
export async function carregarNovasAgencias(): Promise<NovasAgenciasData> {
  return montarNovasAgenciasView(IDENTIDADES_AGENCIAS_COMPARTILHADAS);
}
