"use client";

import { Activity, Building2, Info, Search, Ticket, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  formatarNumero,
  formatarPercentual,
  formatarVariacaoPct,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import { COR_ROSA } from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { Conversao } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface ConversaoPanelProps {
  conversao: Conversao;
}

function CardIndicador({
  icon: Icon,
  label,
  valor,
  destaque,
  subtitulo,
  totalClientes,
}: {
  icon: typeof Activity;
  label: string;
  valor: string;
  destaque?: boolean;
  subtitulo?: string;
  // Mostrado na outra extremidade do card (canto oposto ao ícone/label),
  // só no card "Saúde" (pedido do usuário, 2026-08-19).
  totalClientes?: number;
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
      {subtitulo ? <p className="text-muted-foreground text-xs">{subtitulo}</p> : null}
      {totalClientes !== undefined ? (
        <p className="text-muted-foreground mt-auto self-end text-xs">
          {formatarNumero(totalClientes)} clientes
        </p>
      ) : null}
    </div>
  );
}

// 4.7 — indicadores de conversão. Seletor de canal (Aéreo + Terrestre/
// Aéreo/Terrestre) e os cards "Aéreo no mês"/"Terrestre no mês" foram
// removidos a pedido do usuário (2026-08-19) — painel sempre mostra o
// consolidado "ambos".
export function ConversaoPanel({ conversao }: ConversaoPanelProps) {
  const dados = conversao.ambos;
  const subtitulo = `Comparando ${dados.periodoComparativo}`;

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
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

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardIndicador
          icon={Activity}
          label="Saúde"
          valor={formatarPercentual(dados.saudePct)}
          destaque
          totalClientes={dados.totalClientes}
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
    </div>
  );
}
