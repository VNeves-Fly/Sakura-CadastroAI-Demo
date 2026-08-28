"use server";

import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";
import type { ResumoPersonalizado } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// Mesmo guard de crm/dashboard/page.tsx — Server Actions são endpoints
// próprios (POST), não herdam o redirect da página; sem isto dava pra
// chamar esta action direto, sem passar pelo /crm/dashboard.
const CARGOS_COM_ACESSO = new Set(["ADMIN"]);
const FORMATO_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

async function garantirAcessoAdmin(): Promise<void> {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    throw new Error("Acesso não permitido.");
  }
}

// Chamada pelo popover de período (filtro-periodo-dashboard-popover.tsx)
// quando o usuário aplica um intervalo customizado — nunca no
// carregamento inicial da página (ver dashboard-vendas-view.tsx), porque
// não dá pra pré-computar todo intervalo de datas possível como os 4
// períodos fixos de `obterResumoEDia`. `null` = SST não configurado neste
// ambiente; erro de rede/validação sobe como exceção pro client mostrar.
export async function obterResumoPersonalizadoAction(
  inicioIso: string,
  fimIso: string,
): Promise<ResumoPersonalizado | null> {
  await garantirAcessoAdmin();

  if (!FORMATO_DATA_ISO.test(inicioIso) || !FORMATO_DATA_ISO.test(fimIso)) {
    throw new Error("Datas inválidas.");
  }
  if (inicioIso > fimIso) {
    throw new Error("Data inicial não pode ser depois da data final.");
  }

  return dashboardVendasController.obterResumoPersonalizado(inicioIso, fimIso);
}
