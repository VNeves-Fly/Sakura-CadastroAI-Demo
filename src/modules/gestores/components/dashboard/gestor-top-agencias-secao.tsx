import { Bus, Plane, Trophy } from "lucide-react";
import { GestorTopAgenciasCard } from "@/modules/gestores/components/dashboard/gestor-top-agencias-card";
import { construirRankingsHojeAgenciasGestor } from "@/modules/gestores/utils/agregacoes-gestor.util";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";

interface GestorTopAgenciasSecaoProps {
  crossCanalPromise: ReturnType<typeof gestorDashboardController.obterCrossCanalAgregado>;
}

// Rankings "Top 10 Agências (Hoje)" (SPEC 3.9) — reais desde 2026-08-24, a
// partir de `agenciasCarteira` (já a soma real de todos os executivos
// subordinados, ver gestor-dashboard.controller.ts/obterCrossCanalAgregado).
// Suspense próprio (ver gestor-dashboard-view.tsx) só pra não acoplar a
// renderização deste bloco à de GestorSaudeCarteiraSecao, mas ambos
// resolvem junto (mesma promise).
export async function GestorTopAgenciasSecao({ crossCanalPromise }: GestorTopAgenciasSecaoProps) {
  const { agenciasCarteira } = await crossCanalPromise;
  const { topAgenciasHoje, topAgenciasHojeAereo, topAgenciasHojeTerrestre } =
    construirRankingsHojeAgenciasGestor(agenciasCarteira);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <GestorTopAgenciasCard
        icon={Trophy}
        titulo="Top 10 Agências (Hoje)"
        subtitulo="Modalidade: Aéreo + Terrestre"
        itens={topAgenciasHoje}
        iconLinhaTema="rosa"
      />
      <GestorTopAgenciasCard
        icon={Plane}
        titulo="Top 10 Agências Aéreo"
        subtitulo="Modalidade: Aéreo"
        itens={topAgenciasHojeAereo}
        iconLinhaTema="rosa"
      />
      <GestorTopAgenciasCard
        icon={Bus}
        titulo="Top 10 Agências Terrestre"
        subtitulo="Modalidade: Terrestre"
        itens={topAgenciasHojeTerrestre}
        iconLinhaTema="azul"
      />
    </div>
  );
}
