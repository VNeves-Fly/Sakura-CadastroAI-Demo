import { SaudeCarteiraCard } from "@/modules/atribuicoes/components/executivo/dashboard/saude-carteira-card";
import type { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";

interface ExecutivoSaudeCarteiraSecaoProps {
  crossCanalPromise: ReturnType<typeof executivoDashboardController.obterCrossCanalEMiniStats>;
}

// `saudeCarteira` vem da mesma chamada de `crossCanal` (mesmo roster +
// dados de recência já buscados, ver executivo-dashboard.sst-service.ts)
// — Suspense próprio só pra não acoplar a renderização deste card à de
// `ExecutivoCrossCanalSecao`, mas ambos resolvem junto (mesma promise).
export async function ExecutivoSaudeCarteiraSecao({
  crossCanalPromise,
}: ExecutivoSaudeCarteiraSecaoProps) {
  const { saudeCarteira } = await crossCanalPromise;
  return <SaudeCarteiraCard segmentos={saudeCarteira} />;
}
