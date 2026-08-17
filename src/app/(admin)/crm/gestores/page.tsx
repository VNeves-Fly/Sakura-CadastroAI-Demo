import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { GestoresView } from "@/modules/gestores/views/gestores-view";
import { basesController } from "@/modules/bases/presentation/controllers/bases.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";

const CARGOS_GESTAO_DE_GESTORES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function GestoresPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_GESTORES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const [basesOptions, promotores] = await Promise.all([
    basesController.list(),
    atribuicoesAdminController.listarPromotores(),
  ]);

  // Coluna "Executivos" da lista é dado real — contagem de Promotor.gestorId
  // apontando pra cada gestor (não existe agregação pronta pra isso ainda,
  // ver src/modules/atribuicoes/domain/entities/promotor.entity.ts).
  const executivosPorGestor: Record<string, number> = {};
  for (const promotor of promotores) {
    const gestorId = promotor.gestorId;
    if (!gestorId) continue;
    executivosPorGestor[gestorId] = (executivosPorGestor[gestorId] ?? 0) + 1;
  }

  return <GestoresView basesOptions={basesOptions} executivosPorGestor={executivosPorGestor} />;
}
