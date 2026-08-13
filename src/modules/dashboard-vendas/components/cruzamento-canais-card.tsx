import { Ban, Bus, GitCompareArrows, Plane, Users } from "lucide-react";
import { KpiCard } from "@/modules/dashboard-vendas/components/ui/kpi-card";
import {
  formatarNumero,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_AZUL,
  COR_AZUL_BG,
  COR_PERIGO,
  COR_ROSA,
  COR_ROSA_BG,
  COR_VERDE,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { CruzamentoCanais } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface CruzamentoCanaisCardProps {
  cruzamento: CruzamentoCanais;
}

// 4.11 — cruzamento Aéreo x Terrestre nos últimos 365 dias. O dropdown de
// escopo (total de agências na carteira) é só informativo aqui — não
// existe filtro de carteira real neste projeto ainda.
export function CruzamentoCanaisCard({ cruzamento }: CruzamentoCanaisCardProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <GitCompareArrows className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div>
            <h2 className="text-foreground text-sm font-semibold">Cruzamento Aéreo x Terrestre</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Quantas agências vendem em cada combinação de canais nos últimos 365 dias
            </p>
          </div>
        </div>
        <span className="border-input text-muted-foreground cursor-default rounded-full border px-3 py-1.5 text-xs font-medium">
          {formatarNumero(cruzamento.totalAgenciasCarteira)} agências
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          cor={COR_VERDE}
          corFundoIcone="#D1FAE5"
          label="Vendem AMBOS"
          valor={formatarNumero(cruzamento.ambos.qtd)}
          legenda={`Aéreo + Terrestre · ${formatarPercentual(cruzamento.ambos.pct)} da carteira`}
        />
        <KpiCard
          icon={Plane}
          cor={COR_ROSA}
          corFundoIcone={COR_ROSA_BG}
          label="Só AÉREO"
          valor={formatarNumero(cruzamento.soAereo.qtd)}
          legenda={`Compraram aéreo, nunca terrestre · ${formatarPercentual(cruzamento.soAereo.pct)} da carteira`}
        />
        <KpiCard
          icon={Bus}
          cor={COR_AZUL}
          corFundoIcone={COR_AZUL_BG}
          label="Só TERRESTRE"
          valor={formatarNumero(cruzamento.soTerrestre.qtd)}
          legenda={`Compraram terrestre, nunca aéreo · ${formatarPercentual(cruzamento.soTerrestre.pct)} da carteira`}
        />
        <KpiCard
          icon={Ban}
          cor={COR_PERIGO}
          corFundoIcone="#FEE2E2"
          label="NENHUM canal"
          valor={formatarNumero(cruzamento.nenhum.qtd)}
          legenda={`Aprovadas sem nenhuma venda · ${formatarPercentual(cruzamento.nenhum.pct)} da carteira`}
        />
      </div>
    </div>
  );
}
