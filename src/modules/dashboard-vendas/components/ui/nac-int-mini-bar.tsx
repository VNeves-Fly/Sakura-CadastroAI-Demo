"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  COR_AZUL,
  COR_AZUL_BG,
  COR_ROSA,
  COR_ROSA_BG,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import {
  formatarMoedaAbreviada,
  formatarNumero,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import type { NacionalInternacional } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface NacIntMiniBarProps {
  nacIntDetalhe: NacionalInternacional;
}

function LinhaTooltip({ cor, label, valor }: { cor: string; label: string; valor: string }) {
  return (
    <p className="flex items-center gap-2 text-xs whitespace-nowrap">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground font-bold">{valor}</span>
    </p>
  );
}

// Share Nacional (NAC) x Internacional (INT), mostrado embaixo de cada
// card Aéreo/Terrestre no Resumo do dia — substitui a barra única de
// proporção Aéreo x Terrestre que existia antes ali (pedido do usuário,
// 2026-08-19, print de referência). Passar o mouse na barra mostra os
// dois valores analisados, no mesmo cartão branco (dot + label + valor)
// já usado no tooltip do gráfico de Projeção do dia (pedido do usuário).
export function NacIntMiniBar({ nacIntDetalhe }: NacIntMiniBarProps) {
  const { nacional, internacional } = nacIntDetalhe;
  const total = nacional.valor + internacional.valor;
  const nacionalPct = total > 0 ? (nacional.valor / total) * 100 : 0;
  const internacionalPct = 100 - nacionalPct;

  return (
    <div className="mt-2 flex flex-col gap-1.5 px-1">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-[11px] font-bold tracking-wide">NAC</span>
        <Tooltip>
          <TooltipTrigger
            render={
              <div className="bg-muted flex h-1.5 flex-1 cursor-default overflow-hidden rounded-full" />
            }
          >
            <div
              className="h-full"
              style={{ width: `${nacionalPct}%`, backgroundColor: COR_ROSA }}
            />
            <div className="h-full flex-1" style={{ backgroundColor: COR_AZUL }} />
          </TooltipTrigger>
          <TooltipContent className="bg-card text-foreground flex flex-col gap-1.5 rounded-xl border p-3 shadow-lg">
            <LinhaTooltip
              cor={COR_ROSA}
              label="Nacional"
              valor={`${formatarMoedaAbreviada(nacional.valor)} · ${formatarNumero(nacional.bilhetes)} bilhetes`}
            />
            <LinhaTooltip
              cor={COR_AZUL}
              label="Internacional"
              valor={`${formatarMoedaAbreviada(internacional.valor)} · ${formatarNumero(internacional.bilhetes)} bilhetes`}
            />
          </TooltipContent>
        </Tooltip>
        <span className="text-muted-foreground text-[11px] font-bold tracking-wide">INT</span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ backgroundColor: COR_ROSA_BG, color: COR_ROSA }}
        >
          {formatarPercentual(nacionalPct)}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ backgroundColor: COR_AZUL_BG, color: COR_AZUL }}
        >
          {formatarPercentual(internacionalPct)}
        </span>
      </div>
    </div>
  );
}
