"use client";

import { Inbox, Bot, FileEdit, CheckCircle2, Timer } from "lucide-react";
import { DashboardKpiCard } from "@/modules/admin/components/dashboard-kpi-card";

// Cores reaproveitadas do painel de /cadastros (mesma linguagem visual por
// status): roxo = IA, teal = etapa do analista, verde = ativo. Dados
// mockados (pedido do usuário, 2026-07-30) — sem query real ainda.
const COR_ENTRADA = "#F60F9E";
const COR_IA = "#8A2BE2";
const COR_COMPLEMENTAR = "#008B8B";
const COR_ATIVO = "#008000";
const COR_SLA = "#0284C7";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardKpiCard
          icon={Inbox}
          titulo="Cadastros no dia"
          valor="18"
          descricao="cadastros recebidos hoje"
          cor={COR_ENTRADA}
        />
        <DashboardKpiCard
          icon={Bot}
          titulo="Contrato IA"
          valor="12"
          descricao="cadastros que foram para o contrato da IA"
          cor={COR_IA}
        />
        <DashboardKpiCard
          icon={FileEdit}
          titulo="Em complementar"
          valor="4"
          descricao="cadastros parados em complementar"
          cor={COR_COMPLEMENTAR}
        />
        <DashboardKpiCard
          icon={CheckCircle2}
          titulo="Ativos"
          valor="7"
          descricao="cadastros que viraram ativo"
          cor={COR_ATIVO}
        />
        <DashboardKpiCard
          icon={Timer}
          titulo="SLA"
          valor="3,4 dias"
          descricao="tempo médio do cadastro, da entrada até a saída"
          cor={COR_SLA}
        />
      </div>
    </div>
  );
}
