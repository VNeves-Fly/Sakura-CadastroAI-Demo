"use client";

import { useState } from "react";
import { Bus, Calendar, CalendarDays, CalendarRange, Plane } from "lucide-react";
import { TvHeader } from "@/modules/tv/components/tv-header";
import { TvVendasCard } from "@/modules/tv/components/tv-vendas-card";
import { TvCanalCard } from "@/modules/tv/components/tv-canal-card";
import { TvShareAereoCard } from "@/modules/tv/components/tv-share-aereo-card";
import { TvTop10Card } from "@/modules/tv/components/tv-top10-card";
import { TvPeriodToggle } from "@/modules/tv/components/ui/tv-period-toggle";
import type { PeriodoTv, TvData } from "@/modules/tv/types/tv.types";

interface TvViewProps {
  dados: TvData;
}

// Página "Fast View" (/crm/tv) — reprodução do spec técnico da página
// /tv do Lovable (spectvsakura.md), reconciliada com o print de
// referência do usuário (fast-view2.html) e com o design system deste
// projeto: dentro da shell normal do admin (sidebar/header reais), cards
// no estilo já usado no resto do CRM — não o modo "kiosk" isolado do
// spec original (decisão do usuário, 2026-08-20).
//
// Um único filtro de período (Hoje/Mês/Ano) dirige Aéreo/Terrestre/Share
// Aéreo/os 3 Top 10 — o spec original tinha 6 toggles independentes, um
// por card, mas o print de referência já mostra um único controle pra
// página toda; seguimos essa versão (mesmo espírito do "filtro por
// tempo" do Dashboard CRM). Os 3 cards "Vendas Hoje/Mês/Ano" são fixos,
// sempre mostrados juntos, sem toggle (spec seção 6).
export function TvView({ dados }: TvViewProps) {
  const [periodo, setPeriodo] = useState<PeriodoTv>("hoje");

  return (
    <div className="flex flex-col gap-4">
      <TvHeader />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TvVendasCard
          icon={Calendar}
          label="Vendas Hoje"
          valorTotal={dados.vendas.hoje.valorTotal}
          margemPct={dados.vendas.hoje.margemPct}
        />
        <TvVendasCard
          icon={CalendarDays}
          label="Vendas no Mês"
          valorTotal={dados.vendas.mes.valorTotal}
          margemPct={dados.vendas.mes.margemPct}
        />
        <TvVendasCard
          icon={CalendarRange}
          label="Vendas no Ano"
          valorTotal={dados.vendas.ano.valorTotal}
          margemPct={dados.vendas.ano.margemPct}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs sm:text-sm">
          Os blocos abaixo seguem o período selecionado
        </p>
        <TvPeriodToggle valor={periodo} onChange={setPeriodo} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <TvCanalCard icon={Plane} label="Aéreo" dados={dados.aereo[periodo]} />
        <TvCanalCard icon={Bus} label="Terrestre" dados={dados.terrestre[periodo]} />
        <TvShareAereoCard periodo={periodo} companhias={dados.shareAereo[periodo]} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <TvTop10Card
          titulo="Top 10 Clientes"
          escopoLabel="Aéreo (I + N) + Terrestre"
          periodo={periodo}
          linhas={dados.top10Clientes[periodo]}
        />
        <TvTop10Card
          titulo="Top 10 Nacional"
          escopoLabel="Aéreo Nacional"
          periodo={periodo}
          linhas={dados.top10Nacional[periodo]}
        />
        <TvTop10Card
          titulo="Top 10 Internacional"
          escopoLabel="Aéreo Internacional"
          periodo={periodo}
          linhas={dados.top10Internacional[periodo]}
        />
      </div>
    </div>
  );
}
