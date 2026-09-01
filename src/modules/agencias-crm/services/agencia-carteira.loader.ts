import { MOCK_AGENCIAS_CRM } from "@/modules/crm-mock/agencias.mock-data";
import type { AgenciaCarteiraView } from "@/modules/agencias-crm/types/agencia-carteira.types";

// Repositório de DEMONSTRAÇÃO — /crm/agencias nunca chama o SST nem o
// Postgres local; a carteira inteira vem das 25 identidades fictícias
// canônicas de crm-mock/agencias.mock-data.ts (mesmas que convergem com
// /crm/executivos, /crm/gestores e /crm/novas-agencias).
export async function carregarAgenciasCarteira(): Promise<AgenciaCarteiraView[]> {
  return MOCK_AGENCIAS_CRM;
}
