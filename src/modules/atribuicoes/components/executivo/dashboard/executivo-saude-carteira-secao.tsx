import { SaudeCarteiraCard } from "@/modules/atribuicoes/components/executivo/dashboard/saude-carteira-card";
import type { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";

interface ExecutivoSaudeCarteiraSecaoProps {
  secoesEstaticasPromise: ReturnType<typeof executivoDashboardController.obterSecoesEstaticas>;
}

// `saudeCarteira` é 100% mock hoje (sem I/O, ver executivo-dashboard.controller.ts)
// — em Suspense só por simetria com as outras seções, resolve na hora.
export async function ExecutivoSaudeCarteiraSecao({
  secoesEstaticasPromise,
}: ExecutivoSaudeCarteiraSecaoProps) {
  const { saudeCarteira } = await secoesEstaticasPromise;
  return <SaudeCarteiraCard segmentos={saudeCarteira} />;
}
