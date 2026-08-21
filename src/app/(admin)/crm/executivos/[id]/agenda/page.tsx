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
import { ExecutivoAgendaView } from "@/modules/atribuicoes/views/executivo-agenda-view";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function ExecutivoAgendaPage({ params }: { params: { id: string } }) {
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

  // Mesmo motivo de agencias/page.tsx: header tem que mostrar o mesmo
  // número real de todas as abas.
  const crossCanalPromise = executivoDashboardController.obterCrossCanalEMiniStats(
    perfil.sica,
    perfil.id,
    perfil.totalAgencias,
    agenciasReais,
  );
  const { statsAgenciasSlot, statsVendendo30dSlot } =
    criarExecutivoHeaderStatsSlots(crossCanalPromise);

  return (
    <ExecutivoAgendaView
      perfil={perfil}
      agenciasReais={agenciasReais}
      statsAgenciasSlot={statsAgenciasSlot}
      statsVendendo30dSlot={statsVendendo30dSlot}
    />
  );
}
