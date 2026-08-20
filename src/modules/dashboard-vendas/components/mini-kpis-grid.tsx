import { Ticket, Users } from "lucide-react";
import { KpiCard } from "@/modules/dashboard-vendas/components/ui/kpi-card";
import { formatarNumero } from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_ROSA,
  COR_ROSA_BG,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { MiniKpis } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// 4.2 — 2 mini-KPIs de contexto abaixo do resumo do dia. "Clientes" virou
// "Agências" e o card de Ticket Médio saiu daqui — esse dado já aparece
// dentro dos próprios cards Aéreo/Terrestre do Resumo do dia (pedido do
// usuário, 2026-08-19).
export function MiniKpisGrid({ clientesDistintos, bilhetesAereo }: MiniKpis) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <KpiCard
        icon={Users}
        cor={COR_ROSA}
        corFundoIcone={COR_ROSA_BG}
        label="Agências"
        valor={formatarNumero(clientesDistintos)}
        legenda="agências distintas"
        orientacao="horizontal"
      />
      <KpiCard
        icon={Ticket}
        cor={COR_ROSA}
        corFundoIcone={COR_ROSA_BG}
        label="Bilhetes (Aéreo)"
        valor={formatarNumero(bilhetesAereo)}
        legenda="bilhetes emitidos"
        orientacao="horizontal"
      />
    </div>
  );
}
