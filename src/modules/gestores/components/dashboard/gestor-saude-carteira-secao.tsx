import { TrendingDown, TrendingUp } from "lucide-react";
import { GestorSaudeCarteiraCard } from "@/modules/gestores/components/dashboard/gestor-saude-carteira-card";
import { GestorTopExecutivosCard } from "@/modules/gestores/components/dashboard/gestor-top-executivos-card";
import { construirRankingExecutivos } from "@/modules/gestores/utils/agregacoes-gestor.util";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";

interface GestorSaudeCarteiraSecaoProps {
  crossCanalPromise: ReturnType<typeof gestorDashboardController.obterCrossCanalAgregado>;
  executivos: ExecutivoComCarteira[];
}

// `saudeCarteira` e o ranking de executivos por saúde vêm da mesma
// chamada pesada (crossCanal, ver gestor-dashboard.controller.ts) — os dois
// ficam juntos neste Suspense porque nenhum dos dois tem dado disponível
// antes dela resolver (diferente do Executivo, que não tem ranking de
// subordinados).
export async function GestorSaudeCarteiraSecao({
  crossCanalPromise,
  executivos,
}: GestorSaudeCarteiraSecaoProps) {
  const { saudeCarteira, porExecutivo } = await crossCanalPromise;
  const ranking = construirRankingExecutivos(executivos, porExecutivo);
  const melhorSaude = [...ranking].sort((a, b) => b.pct - a.pct).slice(0, 5);
  const atencao = [...ranking].sort((a, b) => a.pct - b.pct).slice(0, 5);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GestorTopExecutivosCard
          titulo="Top 5 executivos — melhor saúde"
          subtitulo="% agências vendendo nos últimos 30 dias"
          icon={TrendingUp}
          iconClassName="text-success"
          ranking={melhorSaude}
          corBarra="bg-success"
        />
        <GestorTopExecutivosCard
          titulo="5 executivos — atenção"
          subtitulo="Carteiras com menor % de agências vendendo"
          icon={TrendingDown}
          iconClassName="text-destructive"
          ranking={atencao}
          corBarra="bg-destructive"
        />
      </div>

      <GestorSaudeCarteiraCard segmentos={saudeCarteira} />
    </>
  );
}
