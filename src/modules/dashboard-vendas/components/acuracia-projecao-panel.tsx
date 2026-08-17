import { Target } from "lucide-react";
import { CollapsiblePanel } from "@/modules/dashboard-vendas/components/ui/collapsible-panel";
import {
  formatarMoedaBrl,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import type { AcuraciaProjecao } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface AcuraciaProjecaoPanelProps {
  acuracia: AcuraciaProjecao;
}

function tomDoErro(erroMedioPct: number): "success" | "warning" | "danger" {
  if (erroMedioPct <= 2) return "success";
  if (erroMedioPct <= 5) return "warning";
  return "danger";
}

// 4.5 — colapsável; expandido mostra o histórico dia a dia de previsto x
// real que sustenta o erro médio exibido no badge.
export function AcuraciaProjecaoPanel({ acuracia }: AcuraciaProjecaoPanelProps) {
  return (
    <CollapsiblePanel
      icon={<Target className="text-muted-foreground size-4 shrink-0" />}
      titulo="Acurácia da projeção"
      subtitulo="últimos 30 dias"
      badgeTexto={`erro médio ${formatarPercentual(acuracia.erroMedioPct)}`}
      badgeTom={tomDoErro(acuracia.erroMedioPct)}
      avisoMock
    >
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground sticky top-0 bg-inherit">
            <tr>
              <th className="pb-2 font-medium">Dia</th>
              <th className="pb-2 font-medium">Previsto</th>
              <th className="pb-2 font-medium">Real</th>
              <th className="pb-2 text-right font-medium">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {acuracia.historico.map((item) => {
              const diferencaPct =
                item.previsto > 0 ? ((item.real - item.previsto) / item.previsto) * 100 : 0;
              return (
                <tr key={item.dia} className="border-border border-t">
                  <td className="text-foreground py-1.5">{item.dia}</td>
                  <td className="text-muted-foreground py-1.5">
                    {formatarMoedaBrl(item.previsto)}
                  </td>
                  <td className="text-muted-foreground py-1.5">{formatarMoedaBrl(item.real)}</td>
                  <td
                    className={`py-1.5 text-right font-semibold ${diferencaPct >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {diferencaPct >= 0 ? "+" : ""}
                    {formatarPercentual(diferencaPct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CollapsiblePanel>
  );
}
