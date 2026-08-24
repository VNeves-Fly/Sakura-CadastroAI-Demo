import { Bus, Plane, Trophy } from "lucide-react";
import { TopAgenciasExecutivoCard } from "@/modules/atribuicoes/components/executivo/dashboard/top-agencias-executivo-card";
import { construirRankingsHojeAgencias } from "@/modules/atribuicoes/utils/canal-resumo-mock.util";
import type { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";

interface ExecutivoTopAgenciasSecaoProps {
  crossCanalPromise: ReturnType<typeof executivoDashboardController.obterCrossCanalEMiniStats>;
}

// Rankings "Top 10 Agências (Hoje)" (SPEC 3.8) — reais desde 2026-08-24, a
// partir de `agenciasCarteira` (mesma chamada pesada de `crossCanal`, ver
// executivo-dashboard.sst-service.ts). Suspense próprio (ver
// executivo-dashboard-view.tsx) só pra não acoplar a renderização deste
// bloco à de ExecutivoSaudeCarteiraSecao, mas ambos resolvem junto (mesma
// promise).
export async function ExecutivoTopAgenciasSecao({
  crossCanalPromise,
}: ExecutivoTopAgenciasSecaoProps) {
  const { agenciasCarteira } = await crossCanalPromise;
  const { topAgenciasHoje, topAgenciasHojeAereo, topAgenciasHojeTerrestre } =
    construirRankingsHojeAgencias(agenciasCarteira);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <TopAgenciasExecutivoCard
        icon={Trophy}
        titulo="Top 10 Agências (Hoje)"
        subtitulo="Modalidade: Aéreo + Terrestre"
        itens={topAgenciasHoje}
        iconLinhaTema="rosa"
      />
      <TopAgenciasExecutivoCard
        icon={Plane}
        titulo="Top 10 Agências Aéreo"
        subtitulo="Modalidade: Aéreo"
        itens={topAgenciasHojeAereo}
        iconLinhaTema="rosa"
      />
      <TopAgenciasExecutivoCard
        icon={Bus}
        titulo="Top 10 Agências Terrestre"
        subtitulo="Modalidade: Terrestre"
        itens={topAgenciasHojeTerrestre}
        iconLinhaTema="azul"
      />
    </div>
  );
}
