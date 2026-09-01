"use server";

import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import {
  executivoDashboardMockService,
  type DashboardPersonalizadoMock,
} from "@/modules/atribuicoes/services/executivo-dashboard.mock-service";
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

// Este projeto é uma DEMO — sempre mock determinístico, nunca chama o SST
// real (ver executivo-dashboard.mock-service.ts). Usa `id` do executivo
// como chave do hash (em vez de `sica`) pra funcionar mesmo sem código
// SICA cadastrado — nunca cai em "vazio".
function obterDashboardPersonalizadoDoExecutivo(
  executivo: { id: string; sica: number | null },
  inicioIso: string,
  fimIso: string,
): DashboardPersonalizadoMock {
  const chave = executivo.sica != null ? String(executivo.sica) : executivo.id;
  return executivoDashboardMockService.obterDashboardPersonalizado(chave, inicioIso, fimIso);
}

// Chamada pelo popover de período do card "Receita total" (dashboard do
// Gestor) quando o usuário aplica um intervalo personalizado — o Gestor
// não tem código SICA próprio (ver docs/plano-gestores-backend.md §1), só
// a soma agregada dos executivos subordinados, por isso recebe a lista de
// `{id, sica}` inteira e gera 1 mock por executivo (mesma orquestração de
// gestor-dashboard.controller.ts pros períodos fixos, aqui pro intervalo
// ad-hoc).
export async function obterDashboardPersonalizadoGestorAction(
  executivos: { id: string; sica: number | null }[],
  inicioIso: string,
  fimIso: string,
): Promise<DashboardPersonalizadoGestor> {
  await garantirAcesso();

  if (!FORMATO_DATA_ISO.test(inicioIso) || !FORMATO_DATA_ISO.test(fimIso)) {
    throw new Error("Datas inválidas.");
  }
  if (inicioIso > fimIso) {
    throw new Error("Data inicial não pode ser depois da data final.");
  }

  const porExecutivo = executivos.map((executivo) =>
    obterDashboardPersonalizadoDoExecutivo(executivo, inicioIso, fimIso),
  );

  return {
    hero: somarPeriodoHero(porExecutivo.map((p) => p.hero)),
    margemRentab: somarCanalMargemResumo(porExecutivo.map((p) => p.margemRentab)),
  };
}
