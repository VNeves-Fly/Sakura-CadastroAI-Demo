import { DollarSign, Ticket, Users } from "lucide-react";
import { KpiCard } from "@/modules/dashboard-vendas/components/ui/kpi-card";
import {
  formatarMoedaBrl,
  formatarNumero,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_ROSA,
  COR_ROSA_BG,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { MiniKpis } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// 4.2 — 3 mini-KPIs de contexto abaixo do resumo do dia.
export function MiniKpisGrid({ clientesDistintos, bilhetesAereo, ticketMedioAereo }: MiniKpis) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard
        icon={Users}
        cor={COR_ROSA}
        corFundoIcone={COR_ROSA_BG}
        label="Clientes"
        valor={formatarNumero(clientesDistintos)}
        legenda="agências distintas"
      />
      <KpiCard
        icon={Ticket}
        cor={COR_ROSA}
        corFundoIcone={COR_ROSA_BG}
        label="Bilhetes (Aéreo)"
        valor={formatarNumero(bilhetesAereo)}
        legenda="bilhetes emitidos"
      />
      <KpiCard
        icon={DollarSign}
        cor={COR_ROSA}
        corFundoIcone={COR_ROSA_BG}
        label="Ticket Médio Aéreo"
        valor={formatarMoedaBrl(ticketMedioAereo)}
        legenda="tarifa + bilhetes"
      />
    </div>
  );
}
