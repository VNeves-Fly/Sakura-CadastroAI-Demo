"use server";

import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import {
  executivoDashboardSstService,
  type DashboardPersonalizadoSst,
} from "@/modules/atribuicoes/services/executivo-dashboard.sst-service";
import {
  heroVazio,
  margemRentabVazio,
} from "@/modules/atribuicoes/utils/executivo-dashboard-vazio.util";
import {
  somarCanalMargemResumo,
  somarPeriodoHero,
} from "@/modules/gestores/utils/agregacoes-gestor.util";
import type {
  CanalMargemResumoGestor,
  VendasMesHeroGestor,
} from "@/modules/gestores/types/gestor-detalhe.types";

// Mesmo guard de /crm/gestores/[id]/page.tsx (CARGOS_GESTAO_DE_GESTORES) —
// Server Actions são endpoints próprios (POST), não herdam o redirect da
// página. Diferente do Executivo (que permite GESTOR ver a própria
// página), a página do Gestor NÃO permite cargo GESTOR — não replicar o
// conjunto de cargos do Executivo aqui sem checar o guard desta página.
const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);
const FORMATO_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

async function garantirAcesso(): Promise<void> {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    throw new Error("Acesso não permitido.");
  }
}

export interface DashboardPersonalizadoGestor {
  hero: VendasMesHeroGestor;
  margemRentab: CanalMargemResumoGestor;
}

// "0/vazio honesto" (nunca mock) pra um executivo sem SICA ou cuja chamada
// ao SST falhou — mesmo critério de heroVazio/margemRentabVazio usado em
// gestor-dashboard.controller.ts pros períodos fixos; `.mes` serve porque
// os 4 períodos desses builders são idênticos (tudo zerado).
const HERO_VAZIO = heroVazio().mes;
const MARGEM_RENTAB_VAZIO = margemRentabVazio().mes;

async function obterDashboardPersonalizadoDoExecutivo(
  sica: number | null,
  inicioIso: string,
  fimIso: string,
): Promise<DashboardPersonalizadoSst> {
  if (sica == null) return { hero: HERO_VAZIO, margemRentab: MARGEM_RENTAB_VAZIO };
  try {
    return await executivoDashboardSstService.obterDashboardPersonalizado(sica, inicioIso, fimIso);
  } catch {
    return { hero: HERO_VAZIO, margemRentab: MARGEM_RENTAB_VAZIO };
  }
}

// Chamada pelo popover de período do card "Receita total" (dashboard do
// Gestor) quando o usuário aplica um intervalo personalizado — o Gestor
// não tem código SICA próprio (ver docs/plano-gestores-backend.md §1), só
// a soma agregada dos executivos subordinados, por isso recebe a lista de
// `{id, sica}` inteira e dispara 1 chamada por executivo (mesma
// orquestração de gestor-dashboard.controller.ts pros períodos fixos, aqui
// pro intervalo ad-hoc). `null` = SST não configurado neste ambiente.
export async function obterDashboardPersonalizadoGestorAction(
  executivos: { id: string; sica: number | null }[],
  inicioIso: string,
  fimIso: string,
): Promise<DashboardPersonalizadoGestor | null> {
  await garantirAcesso();

  if (!process.env.SST_API_KEY) return null;
  if (!FORMATO_DATA_ISO.test(inicioIso) || !FORMATO_DATA_ISO.test(fimIso)) {
    throw new Error("Datas inválidas.");
  }
  if (inicioIso > fimIso) {
    throw new Error("Data inicial não pode ser depois da data final.");
  }

  const porExecutivo = await Promise.all(
    executivos.map((executivo) =>
      obterDashboardPersonalizadoDoExecutivo(executivo.sica, inicioIso, fimIso),
    ),
  );

  return {
    hero: somarPeriodoHero(porExecutivo.map((p) => p.hero)),
    margemRentab: somarCanalMargemResumo(porExecutivo.map((p) => p.margemRentab)),
  };
}
