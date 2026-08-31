"use server";

import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import {
  executivoDashboardSstService,
  type DashboardPersonalizadoSst,
} from "@/modules/atribuicoes/services/executivo-dashboard.sst-service";

// Mesmo guard de /crm/executivos/[id]/page.tsx — Server Actions são
// endpoints próprios (POST), não herdam o redirect da página.
const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA", "GESTOR"]);
const FORMATO_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

async function garantirAcesso(): Promise<void> {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    throw new Error("Acesso não permitido.");
  }
}

// Chamada pelo popover de período do card "Receita total" (dashboard do
// Executivo) quando o usuário aplica um intervalo personalizado — mesma
// ideia de obterVolumePersonalizadoAction em agencias-crm, aqui filtrado
// por `codigoExecutivo` (código SICA). `null` = SST não configurado neste
// ambiente.
export async function obterDashboardPersonalizadoAction(
  codigoExecutivo: number,
  inicioIso: string,
  fimIso: string,
): Promise<DashboardPersonalizadoSst | null> {
  await garantirAcesso();

  if (!process.env.SST_API_KEY) return null;
  if (!FORMATO_DATA_ISO.test(inicioIso) || !FORMATO_DATA_ISO.test(fimIso)) {
    throw new Error("Datas inválidas.");
  }
  if (inicioIso > fimIso) {
    throw new Error("Data inicial não pode ser depois da data final.");
  }

  return executivoDashboardSstService.obterDashboardPersonalizado(
    codigoExecutivo,
    inicioIso,
    fimIso,
  );
}
