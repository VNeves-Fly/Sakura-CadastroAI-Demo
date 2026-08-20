import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";
import { criarExecutivoHeaderStatsSlots } from "@/modules/atribuicoes/components/executivo/dashboard/executivo-header-stats";
import {
  mapAgencia,
  montarExecutivoPerfil,
} from "@/modules/atribuicoes/adapters/executivo-detalhe.adapter";
import { ExecutivoAgenciasView } from "@/modules/atribuicoes/views/executivo-agencias-view";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function ExecutivoAgenciasPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  const cargo = session?.user.cargo;

  if (!cargo || (cargo !== "GESTOR" && !CARGOS_ADMIN.has(cargo))) {
    redirect("/cadastros");
  }

  const promotor = await atribuicoesAdminController.buscarPromotorPorId(params.id);
  if (!promotor) notFound();

  const [gestores, agencias] = await Promise.all([
    atribuicoesAdminController.listarGestores(),
    atribuicoesAdminController.listarAgenciasPorPromotor(params.id),
  ]);
  const gestoresPorId = new Map(
    gestores.map((gestor) => [
      gestor.id,
      { id: gestor.id, nome: gestor.nome, bases: gestor.bases },
    ]),
  );

  const perfil = montarExecutivoPerfil(promotor.toJSON(), gestoresPorId, agencias);
  const agenciasReais = agencias.map(mapAgencia);

  // "Agências"/"Venderam últimos 30d" do header têm que bater com o
  // mesmo número do dashboard (ver executivo-dashboard-view.tsx) — não dá
  // pra reaproveitar `perfil.totalAgencias` (banco local) aqui. Disparado
  // sem `await` (Suspense cuida do streaming, ver criarExecutivoHeaderStatsSlots),
  // então não atrasa o resto da página.
  const crossCanalPromise = executivoDashboardController.obterCrossCanalEMiniStats(
    perfil.sica,
    perfil.id,
    perfil.totalAgencias,
    agenciasReais,
  );
  const { statsAgenciasSlot, statsVendendo30dSlot } =
    criarExecutivoHeaderStatsSlots(crossCanalPromise);

  return (
    <ExecutivoAgenciasView
      perfil={perfil}
      agenciasReais={agenciasReais}
      statsAgenciasSlot={statsAgenciasSlot}
      statsVendendo30dSlot={statsVendendo30dSlot}
    />
  );
}
