import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { GestoresView } from "@/modules/gestores/views/gestores-view";
import { basesController } from "@/modules/bases/presentation/controllers/bases.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";

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

  // "Vendas mês"/"Vendas ano" da lista de Gestores (SPEC seção 2.2) — Gestor
  // não existe no SST (sem `sica` próprio), então "real" aqui é a soma das
  // vendas reais dos executivos subordinados — mesmo fan-out de
  // comVendasReais (promotores.routes.ts), só que agregado por gestorId em
  // vez de 1 linha por promotor. Cada chamada individual nunca rejeita (ver
  // executivoDashboardController.obterVendasResumo).
  const vendasPorPromotor = await Promise.all(
    promotores.map((promotor) => executivoDashboardController.obterVendasResumo(promotor.sica)),
  );
  const vendasPorGestor: Record<string, { vendasMes: number; vendasAno: number }> = {};
  promotores.forEach((promotor, indice) => {
    const gestorId = promotor.gestorId;
    if (!gestorId) return;
    const vendas = vendasPorPromotor[indice]!;
    const acumulado = vendasPorGestor[gestorId] ?? { vendasMes: 0, vendasAno: 0 };
    vendasPorGestor[gestorId] = {
      vendasMes: acumulado.vendasMes + vendas.vendasMes,
      vendasAno: acumulado.vendasAno + vendas.vendasAno,
    };
  });

  return (
    <GestoresView
      basesOptions={basesOptions}
      executivosPorGestor={executivosPorGestor}
      vendasPorGestor={vendasPorGestor}
    />
  );
}
