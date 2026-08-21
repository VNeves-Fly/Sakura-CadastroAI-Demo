import { AgenciasCarteiraInterativa } from "@/modules/atribuicoes/components/executivo/agencias/agencias-carteira-interativa";
import type { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";

interface AgenciasCarteiraSecaoProps {
  crossCanalPromise: ReturnType<typeof executivoDashboardController.obterCrossCanalEMiniStats>;
}

// `agenciasCarteira` vem da mesma chamada de `crossCanal` (roster + dados
// de recência já buscados pro dashboard, ver executivo-dashboard.sst-service.ts)
// — nenhuma chamada nova ao SST só por causa desta aba.
export async function AgenciasCarteiraSecao({ crossCanalPromise }: AgenciasCarteiraSecaoProps) {
  const { agenciasCarteira } = await crossCanalPromise;
  return <AgenciasCarteiraInterativa agenciasCarteira={agenciasCarteira} />;
}
