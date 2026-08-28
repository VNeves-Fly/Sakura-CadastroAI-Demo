"use client";

import type { LucideIcon } from "lucide-react";
import { Bus, Clock, Plane } from "lucide-react";
import { MargemRentabBloco } from "@/modules/dashboard-vendas/components/ui/margem-rentab-bloco";
import { NacIntMiniBar } from "@/modules/dashboard-vendas/components/ui/nac-int-mini-bar";
import { FiltroPeriodoDashboardPopover } from "@/modules/dashboard-vendas/components/ui/filtro-periodo-dashboard-popover";
import { PersonalizadoAviso } from "@/modules/dashboard-vendas/components/ui/personalizado-aviso";
import { formatarAtualizadoEm } from "@/modules/dashboard-vendas/utils/formatar-data.util";
import { cn } from "@/lib/utils";
import { formatarMoedaBrl } from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  useFiltroPeriodoDashboardStore,
  resolverPeriodo,
} from "@/modules/dashboard-vendas/stores/filtro-periodo-dashboard.store";
import type {
  CanalResumo,
  PeriodoResumo,
  ResumoDia,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface ResumoDoDiaCardProps {
  resumoPorPeriodo: Record<PeriodoResumo, ResumoDia>;
}

interface CanalCardProps {
  canal: CanalResumo;
  titulo: string;
  unidade: string;
  icon: LucideIcon;
  tema: "rosa" | "azul";
  ticketMedio: number;
}

// Cartão de canal (Aéreo/Terrestre) — mesmo layout de
// canal-resumo-card.tsx do dashboard do Executivo (ícone + valor +
// MargemRentabBloco "pequeno" lado a lado, quantidade/ticket médio
// embaixo), pedido do usuário (2026-08-28) pra manter os dois dashboards
// visualmente idênticos.
function CanalCard({ canal, titulo, unidade, icon: Icon, tema, ticketMedio }: CanalCardProps) {
  return (
    <div>
      <div className="border-border rounded-xl border p-4">
        <div className="flex gap-4">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
              tema === "rosa" ? "bg-primary/10 text-primary" : "bg-info/10 text-info",
            )}
          >
            <Icon className="size-4.5" />
          </span>

          <div className="flex min-w-0 flex-col gap-0.5">
            <p
              className={cn(
                "text-[11px] font-extrabold tracking-[0.1em] uppercase",
                tema === "rosa" ? "text-primary" : "text-info",
              )}
            >
              {titulo}
            </p>

            <p className="text-foreground text-[22px] leading-tight font-extrabold tracking-tight">
              {formatarMoedaBrl(canal.valor)}
            </p>

            {/* Abaixo do valor (não mais ao lado) — pedido do usuário,
                2026-08-28. */}
            <div className="mt-1">
              <MargemRentabBloco
                margemLabel="MARGEM"
                margemPct={canal.margemPct}
                margemLYPct={canal.margemLYPct}
                margemVariacaoPct={canal.margemVariacaoPct}
                rentabLYValor={canal.rentabLYValor}
                rentabLYVariacaoPct={canal.rentabLYVariacaoPct}
                tamanho="pequeno"
              />
            </div>

            <p className="text-muted-foreground mt-1 text-[13px]">
              {canal.quantidade} {unidade}
            </p>
            <p className="text-muted-foreground text-[13px]">
              Ticket médio: {formatarMoedaBrl(ticketMedio)}
            </p>
          </div>
        </div>
      </div>
      <NacIntMiniBar nacIntDetalhe={canal.nacIntDetalhe} />
    </div>
  );
}

// 4.1 — KPI principal do topo, seletor de período e o par Aéreo/Terrestre,
// cada um com sua barra de share Nacional/Internacional embaixo. Filtro de
// período agora vem da store global (`useFiltroPeriodoDashboardStore`) —
// dirige também os mini-KPIs de baixo e os rankings de Top 10 Agências/
// Fornecedores (pedido do usuário, 2026-08-20; antes era state local só
// deste card, levantado uma vez até `ResumoDoDiaComMiniKpis` em 2026-08-19).
export function ResumoDoDiaCard({ resumoPorPeriodo }: ResumoDoDiaCardProps) {
  const filtro = useFiltroPeriodoDashboardStore((estado) => estado.filtro);
  const {
    dados: personalizadoDados,
    carregando: personalizadoCarregando,
    erro: personalizadoErro,
  } = useFiltroPeriodoDashboardStore((estado) => estado.personalizado);
  const personalizado = filtro === "personalizado";
  const periodoComDados: PeriodoResumo = resolverPeriodo(filtro);
  const resumo =
    personalizado && personalizadoDados
      ? personalizadoDados.resumo
      : resumoPorPeriodo[periodoComDados];
  const totalPeriodo = resumo.aereo.valor + resumo.terrestre.valor;
  // Ticket médio por canal — computado aqui mesmo (valor / quantidade),
  // sem precisar de dado novo (pedido do usuário, 2026-08-19).
  const ticketMedioAereo =
    resumo.aereo.quantidade > 0 ? resumo.aereo.valor / resumo.aereo.quantidade : 0;
  const ticketMedioTerrestre =
    resumo.terrestre.quantidade > 0 ? resumo.terrestre.valor / resumo.terrestre.quantidade : 0;

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="bg-clip-text text-4xl font-black break-words text-transparent sm:text-[42px]"
            style={{ backgroundImage: "linear-gradient(90deg, #EC0C8C, #8B5CF6, #3B82F6)" }}
          >
            {formatarMoedaBrl(totalPeriodo)}
          </p>
          {/* Mesmo bloco "MARGEM.../RENTAB. LY" do dashboard do Executivo
              (ver margem-rentab-bloco.tsx), abaixo do valor total — não
              mais ao lado (pedido do usuário, 2026-08-28), pra manter os
              dois dashboards visualmente idênticos. */}
          <div className="mt-2">
            <MargemRentabBloco
              margemLabel="MARGEM TOTAL"
              margemPct={resumo.margemTotalPct}
              margemLYPct={resumo.margemTotalLYPct}
              margemVariacaoPct={resumo.margemTotalVariacaoPct}
              rentabLYValor={resumo.rentabTotalLYValor}
              rentabLYVariacaoPct={resumo.rentabTotalLYVariacaoPct}
              tamanho="grande"
            />
          </div>
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <Clock className="size-3.5" />
            Atualizado em {formatarAtualizadoEm(resumo.atualizadoEm)}
          </p>
        </div>

        <FiltroPeriodoDashboardPopover />
      </div>

      {personalizado && personalizadoCarregando ? (
        <PersonalizadoAviso mensagem="Carregando período personalizado…" carregando />
      ) : null}
      {personalizado && !personalizadoCarregando && personalizadoErro ? (
        <PersonalizadoAviso mensagem={`${personalizadoErro} Mostrando prévia de "Este mês".`} />
      ) : null}
      {personalizado && !personalizadoCarregando && !personalizadoErro && !personalizadoDados ? (
        <PersonalizadoAviso mensagem='Prévia com os dados de "Este mês" — selecione um período no calendário.' />
      ) : null}

      {/* Grid Aéreo/Terrestre — cada canal tem seu próprio share Nacional/
          Internacional (nacIntDetalhe vem do mesmo bucket de origem que
          valor/margem daquele canal — não é o mesmo dado duplicado entre
          os dois). */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CanalCard
          canal={resumo.aereo}
          titulo="Aéreo"
          unidade="bilhetes"
          icon={Plane}
          tema="rosa"
          ticketMedio={ticketMedioAereo}
        />
        <CanalCard
          canal={resumo.terrestre}
          titulo="Terrestre"
          unidade="vendas"
          icon={Bus}
          tema="azul"
          ticketMedio={ticketMedioTerrestre}
        />
      </div>
    </div>
  );
}
