"use client";

import { useState } from "react";
import { Activity, Building2, Info, Search, Ticket, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import {
  formatarMoedaBrl,
  formatarNumero,
  formatarPercentual,
  formatarVariacaoPct,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import { COR_ROSA } from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { Canal, Conversao } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const OPCOES_CANAL: { valor: Canal; label: string }[] = [
  { valor: "ambos", label: "Aéreo + Terrestre" },
  { valor: "aereo", label: "Aéreo" },
  { valor: "terrestre", label: "Terrestre" },
];

interface ConversaoPanelProps {
  conversao: Conversao;
}

function CardIndicador({
  icon: Icon,
  label,
  valor,
  destaque,
  subtitulo,
}: {
  icon: typeof Activity;
  label: string;
  valor: string;
  destaque?: boolean;
  subtitulo: string;
}) {
  return (
    <div className="border-border bg-card relative flex flex-col gap-1 rounded-2xl border p-4">
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground absolute top-3 right-3"
        aria-label="Ver detalhes"
      >
        <Search className="size-3.5" />
      </button>
      <Icon className="size-4" style={{ color: destaque ? COR_ROSA : "var(--muted-foreground)" }} />
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{label}</p>
      <p
        className="text-2xl font-black"
        style={{ color: destaque ? COR_ROSA : "var(--foreground)" }}
      >
        {valor}
      </p>
      <p className="text-muted-foreground text-xs">{subtitulo}</p>
    </div>
  );
}

// 4.7 — indicadores de conversão com seletor de canal, mesmo padrão de
// texto comparativo em todos os 4 cards.
export function ConversaoPanel({ conversao }: ConversaoPanelProps) {
  const [canal, setCanal] = useState<Canal>("ambos");
  const dados = conversao[canal];
  const subtitulo = `Comparando ${dados.periodoComparativo}`;

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="text-muted-foreground size-4 shrink-0" />
          <h2 className="text-foreground text-sm font-semibold">Conversão</h2>
          <Tooltip>
            <TooltipTrigger render={<button type="button" aria-label="O que é este painel" />}>
              <Info className="text-muted-foreground size-3.5" />
            </TooltipTrigger>
            <TooltipContent>
              Saúde de conversão da carteira e variação mês a mês por canal de venda.
            </TooltipContent>
          </Tooltip>
        </div>
        <PeriodToggle opcoes={OPCOES_CANAL} valor={canal} onChange={setCanal} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardIndicador
          icon={Activity}
          label="Saúde"
          valor={formatarPercentual(dados.saudePct)}
          destaque
          subtitulo={subtitulo}
        />
        <CardIndicador
          icon={TrendingUp}
          label="Volume Mês (A+T)"
          valor={formatarVariacaoPct(dados.volumeMesVarPct)}
          subtitulo={subtitulo}
        />
        <CardIndicador
          icon={Ticket}
          label="Bilhetes/Vendas Mês"
          valor={formatarVariacaoPct(dados.bilhetesVendasMesVarPct)}
          subtitulo={subtitulo}
        />
        <CardIndicador
          icon={Building2}
          label="Agências Mês"
          valor={formatarVariacaoPct(dados.agenciasMesVarPct)}
          subtitulo={subtitulo}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="border-border rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Aéreo no mês
          </p>
          <p className="text-foreground mt-1 text-xl font-bold">
            {formatarMoedaBrl(dados.aereoMes.valor)}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatarNumero(dados.aereoMes.bilhetes)} bilhetes
          </p>
        </div>
        <div className="border-border rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Terrestre no mês
          </p>
          <p className="text-foreground mt-1 text-xl font-bold">
            {formatarMoedaBrl(dados.terrestreMes.valor)}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatarNumero(dados.terrestreMes.vendas)} vendas (hotéis/transfers)
          </p>
        </div>
      </div>
    </div>
  );
}
