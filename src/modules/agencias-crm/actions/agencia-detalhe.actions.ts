"use server";

import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { usaSstReal } from "@/modules/agencias-crm/infrastructure/agencia-sst-client.util";
import {
  agenciaDetalheSstService,
  type VolumeCanalPeriodoSst,
} from "@/modules/agencias-crm/services/agencia-detalhe.sst-service";

// Mesmo guard de /crm/agencias/[id]/page.tsx — Server Actions são
// endpoints próprios (POST), não herdam o redirect da página.
const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);
const FORMATO_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

async function garantirAcesso(): Promise<void> {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    throw new Error("Acesso não permitido.");
  }
}

// Chamada pelo popover de período do card "Volume total" (aba Dashboard
// do detalhe de Agência) quando o usuário aplica um intervalo
// personalizado — mesma ideia de obterResumoPersonalizadoAction em
// dashboard-vendas, aqui filtrado pra uma única agência via
// `codigoEmpresa` (código SICA). `null` = SST não configurado neste
// ambiente ou agência sem código SICA (nunca teve integração real).
export async function obterVolumePersonalizadoAction(
  codigoEmpresa: string,
  inicioIso: string,
  fimIso: string,
): Promise<VolumeCanalPeriodoSst | null> {
  await garantirAcesso();

  if (!usaSstReal()) return null;
  if (!FORMATO_DATA_ISO.test(inicioIso) || !FORMATO_DATA_ISO.test(fimIso)) {
    throw new Error("Datas inválidas.");
  }
  if (inicioIso > fimIso) {
    throw new Error("Data inicial não pode ser depois da data final.");
  }

  return agenciaDetalheSstService.obterVolumePersonalizado(codigoEmpresa, inicioIso, fimIso);
}
