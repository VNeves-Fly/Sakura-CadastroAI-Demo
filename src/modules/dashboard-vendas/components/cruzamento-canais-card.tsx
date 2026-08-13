"use client";

import { useState } from "react";
import { Bus, GitCompareArrows, Info, Plane, Users } from "lucide-react";
import { CruzamentoDetalheModal } from "@/modules/dashboard-vendas/components/cruzamento-detalhe-modal";
import {
  formatarNumero,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_AZUL,
  COR_AZUL_BG,
  COR_ROSA,
  COR_ROSA_BG,
  COR_VERDE,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type {
  AgenciaCruzamentoDetalhe,
  ChaveCruzamento,
  CruzamentoCanais,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface CruzamentoCanaisCardProps {
  cruzamento: CruzamentoCanais;
  cruzamentoDetalhe: Record<ChaveCruzamento, AgenciaCruzamentoDetalhe[]>;
}

const TITULO_MODAL: Record<ChaveCruzamento, string> = {
  ambos: "Vendem AMBOS",
  soAereo: "Só AÉREO",
  soTerrestre: "Só TERRESTRE",
  nenhum: "NENHUM canal",
};

// 4.11 — cruzamento Aéreo x Terrestre nos últimos 365 dias. Estilo dos 4
// cards replicado do print de referência (preenchimento sólido em 3 dos
// 4). O dropdown de escopo (total de agências na carteira) é só
// informativo aqui — não existe filtro de carteira real neste projeto.
export function CruzamentoCanaisCard({ cruzamento, cruzamentoDetalhe }: CruzamentoCanaisCardProps) {
  const [modalAberto, setModalAberto] = useState<ChaveCruzamento | null>(null);

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <GitCompareArrows className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div>
            <h2 className="text-foreground text-sm font-semibold">Cruzamento Aéreo x Terrestre</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Quantas agências vendem em cada combinação de canais nos últimos 365 dias
            </p>
          </div>
        </div>
        <span className="border-input text-muted-foreground cursor-default rounded-full border px-3 py-1.5 text-xs font-medium">
          {formatarNumero(cruzamento.totalAgenciasCarteira)} agências
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => setModalAberto("ambos")}
          className="flex flex-col gap-1 rounded-2xl p-4 text-left transition hover:brightness-105"
          style={{ backgroundColor: COR_VERDE }}
        >
          <Users className="size-4 text-white/90" />
          <p className="mt-1 text-[11px] font-bold tracking-wide text-white/90 uppercase">
            Vendem AMBOS
          </p>
          <p className="text-2xl font-black text-white sm:text-[28px]">
            {formatarNumero(cruzamento.ambos.qtd)}
          </p>
          <p className="text-xs text-white/75">
            Aéreo + Terrestre · {formatarPercentual(cruzamento.ambos.pct, 0)} da carteira
          </p>
        </button>

        <button
          type="button"
          onClick={() => setModalAberto("soAereo")}
          className="hover:border-primary/40 flex flex-col gap-1 rounded-2xl border p-4 text-left transition"
          style={{ backgroundColor: COR_ROSA_BG, borderColor: `${COR_ROSA}40` }}
        >
          <Plane className="size-4" style={{ color: COR_ROSA }} />
          <p
            className="mt-1 text-[11px] font-bold tracking-wide uppercase"
            style={{ color: COR_ROSA }}
          >
            Só AÉREO
          </p>
          <p className="text-foreground text-2xl font-black sm:text-[28px]">
            {formatarNumero(cruzamento.soAereo.qtd)}
          </p>
          <p className="text-muted-foreground text-xs">
            Compraram aéreo, nunca terrestre · {formatarPercentual(cruzamento.soAereo.pct, 0)} da
            carteira
          </p>
        </button>

        <button
          type="button"
          onClick={() => setModalAberto("soTerrestre")}
          className="hover:border-primary/40 flex flex-col gap-1 rounded-2xl border p-4 text-left transition"
          style={{ backgroundColor: COR_AZUL_BG, borderColor: `${COR_AZUL}40` }}
        >
          <Bus className="size-4" style={{ color: COR_AZUL }} />
          <p
            className="mt-1 text-[11px] font-bold tracking-wide uppercase"
            style={{ color: COR_AZUL }}
          >
            Só TERRESTRE
          </p>
          <p className="text-foreground text-2xl font-black sm:text-[28px]">
            {formatarNumero(cruzamento.soTerrestre.qtd)}
          </p>
          <p className="text-muted-foreground text-xs">
            Compraram terrestre, nunca aéreo · {formatarPercentual(cruzamento.soTerrestre.pct, 0)}{" "}
            da carteira
          </p>
        </button>

        <button
          type="button"
          onClick={() => setModalAberto("nenhum")}
          className="border-border bg-card hover:border-primary/40 flex flex-col gap-1 rounded-2xl border p-4 text-left transition"
        >
          <Info className="text-muted-foreground size-4" />
          <p className="text-muted-foreground mt-1 text-[11px] font-bold tracking-wide uppercase">
            NENHUM canal
          </p>
          <p className="text-foreground text-2xl font-black sm:text-[28px]">
            {formatarNumero(cruzamento.nenhum.qtd)}
          </p>
          <p className="text-muted-foreground text-xs">
            Aprovadas sem nenhuma venda · {formatarPercentual(cruzamento.nenhum.pct, 0)} da carteira
          </p>
        </button>
      </div>

      <CruzamentoDetalheModal
        aberto={modalAberto !== null}
        onOpenChange={(aberto) => setModalAberto(aberto ? modalAberto : null)}
        titulo={modalAberto ? TITULO_MODAL[modalAberto] : ""}
        totalReal={modalAberto ? cruzamento[modalAberto].qtd : 0}
        pct={modalAberto ? cruzamento[modalAberto].pct : 0}
        itens={modalAberto ? cruzamentoDetalhe[modalAberto] : []}
      />
    </div>
  );
}
