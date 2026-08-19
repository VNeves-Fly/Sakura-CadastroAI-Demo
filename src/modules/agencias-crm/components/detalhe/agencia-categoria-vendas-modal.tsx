"use client";

import type { ReactNode } from "react";
import { Bus, Globe2, Plane } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  COR_AEREO_INTERNACIONAL,
  COR_AEREO_NACIONAL,
  COR_TERRESTRE,
} from "@/modules/agencias-crm/constants/agencia-dashboard.constants";
import { formatarMoedaAbreviada } from "@/modules/agencias-crm/utils/formatar-moeda.util";
import type { AgenciaDetalheVendas } from "@/modules/agencias-crm/types/agencia-detalhe.types";

export type CategoriaVenda = "nacional" | "internacional" | "terrestre";

interface AgenciaCategoriaVendasModalProps {
  categoria: CategoriaVenda | null;
  vendas: AgenciaDetalheVendas;
  onOpenChange: (open: boolean) => void;
}

const CONFIG: Record<
  CategoriaVenda,
  { titulo: string; modalidade: string; icon: typeof Plane; cor: string }
> = {
  nacional: {
    titulo: "Aéreo Nacional",
    modalidade: "Aéreo Nacional",
    icon: Plane,
    cor: COR_AEREO_NACIONAL,
  },
  internacional: {
    titulo: "Aéreo Internacional",
    modalidade: "Aéreo Internacional",
    icon: Globe2,
    cor: COR_AEREO_INTERNACIONAL,
  },
  terrestre: {
    titulo: "Terrestre",
    modalidade: "Terrestre",
    icon: Bus,
    cor: COR_TERRESTRE,
  },
};

function MiniStat({ label, valor }: { label: string; valor: ReactNode }) {
  return (
    <div className="border-border rounded-lg border p-3 text-center">
      <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground mt-1 text-sm font-bold tabular-nums">{valor}</p>
    </div>
  );
}

// Modal de detalhe por categoria (Aéreo Nacional/Internacional/Terrestre),
// aberto ao clicar num dos 3 cards da Visão Geral de Vendas — reúne o que
// antes estava espalhado em "Mix Aéreo × Terrestre" e "Resumo Comparativo"
// (ambos removidos, pedido do usuário 2026-08-19) mais a série mensal já
// calculada em vendas.evolucaoMensal, filtrada pra só a linha desta
// categoria.
export function AgenciaCategoriaVendasModal({
  categoria,
  vendas,
  onOpenChange,
}: AgenciaCategoriaVendasModalProps) {
  const cfg = categoria ? CONFIG[categoria] : null;
  const dadosBase =
    categoria === "nacional"
      ? vendas.aereoNacional
      : categoria === "internacional"
        ? vendas.aereoInternacional
        : categoria === "terrestre"
          ? vendas.terrestre
          : null;
  const resumo = cfg
    ? (vendas.resumoComparativo.find((linha) => linha.modalidade === cfg.modalidade) ?? null)
    : null;

  return (
    <Dialog open={categoria !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {categoria && cfg && dadosBase ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <cfg.icon className="size-4" style={{ color: cfg.cor }} />
                {cfg.titulo}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5 p-4">
              <div>
                <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                  Volume no ano
                </p>
                <p className="text-foreground mt-1 text-3xl font-bold tabular-nums">
                  <SensitiveValue value={formatarMoedaAbreviada(dadosBase.volume)} />
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {"bilhetes" in dadosBase
                    ? `${dadosBase.bilhetes} bilhetes`
                    : `${dadosBase.servicos} serviços`}
                  {" · "}
                  {"pctAereo" in dadosBase
                    ? `${dadosBase.pctAereo}% do aéreo`
                    : `${dadosBase.pctMix}% do mix`}
                </p>
              </div>

              {resumo ? (
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat label="% do total" valor={`${resumo.pctMix}%`} />
                  <MiniStat
                    label="Média mensal"
                    valor={<SensitiveValue value={formatarMoedaAbreviada(resumo.mediaMensal)} />}
                  />
                  <MiniStat label="Itens (ano)" valor={resumo.itens} />
                </div>
              ) : null}

              <div>
                <p className="text-foreground mb-2 text-sm font-semibold">Evolução mensal</p>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vendas.evolucaoMensal} margin={{ left: -16 }}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="mes"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(valor: number) => formatarMoedaAbreviada(valor)}
                        width={64}
                      />
                      <Tooltip
                        formatter={(valor) => formatarMoedaAbreviada(Number(valor))}
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey={categoria}
                        stroke={cfg.cor}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
