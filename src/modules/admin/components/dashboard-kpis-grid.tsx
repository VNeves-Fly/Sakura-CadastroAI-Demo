"use client";

import { Inbox, Bot, FileEdit, CheckCircle2 } from "lucide-react";
import { DashboardKpiCard } from "@/modules/admin/components/dashboard-kpi-card";

// Cores reaproveitadas do painel de /cadastros (mesma linguagem visual por
// status): rosa = entrada, roxo = IA, teal = etapa do analista, verde =
// ativo.
const COR_ENTRADA = "#F60F9E";
const COR_IA = "#8A2BE2";
const COR_COMPLEMENTAR = "#008B8B";
const COR_ATIVO = "#008000";

interface SeriePeriodoItem {
  periodo: string;
  quantidade: number;
}

interface SeriesMovimentacao {
  dia: SeriePeriodoItem[];
  mes: SeriePeriodoItem[];
  ano: SeriePeriodoItem[];
}

interface DashboardKpisGridProps {
  novosCadastros30Dias: number;
  contratosIa30Dias: number;
  emComplementar: number;
  ativas: number;
  seriesNovosCadastros: SeriesMovimentacao;
  seriesContratosIa: SeriesMovimentacao;
  seriesEmComplementar: SeriesMovimentacao;
  seriesAtivas: SeriesMovimentacao;
}

// Client Component só pra isolar os ícones do lucide-react (funções, não
// serializáveis) dentro da fronteira client — DashboardKpiCard também é
// "use client", então passar `icon={Inbox}` direto de dashboard/page.tsx
// (Server Component, busca dado real) pra ele quebra em produção
// ("Functions cannot be passed directly to Client Components"), mesmo
// funcionando em dev por causa de diferenças de bundling entre os modos.
// Recebendo só números/objetos simples como props (serializáveis) e
// resolvendo os ícones aqui dentro, a fronteira nunca precisa serializar
// uma função.
export function DashboardKpisGrid({
  novosCadastros30Dias,
  contratosIa30Dias,
  emComplementar,
  ativas,
  seriesNovosCadastros,
  seriesContratosIa,
  seriesEmComplementar,
  seriesAtivas,
}: DashboardKpisGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardKpiCard
        icon={Inbox}
        titulo="Novos cadastros"
        valor={String(novosCadastros30Dias)}
        descricao="nos últimos 30 dias"
        cor={COR_ENTRADA}
        series={seriesNovosCadastros}
      />
      <DashboardKpiCard
        icon={Bot}
        titulo="Contratos IA"
        valor={String(contratosIa30Dias)}
        descricao="gerados pela IA nos últimos 30 dias"
        cor={COR_IA}
        series={seriesContratosIa}
      />
      <DashboardKpiCard
        icon={FileEdit}
        titulo="Em complementar"
        valor={String(emComplementar)}
        descricao="cadastros parados em complementar"
        cor={COR_COMPLEMENTAR}
        series={seriesEmComplementar}
      />
      <DashboardKpiCard
        icon={CheckCircle2}
        titulo="Ativas"
        valor={String(ativas)}
        descricao="agências liberadas e operando"
        cor={COR_ATIVO}
        series={seriesAtivas}
      />
    </div>
  );
}
