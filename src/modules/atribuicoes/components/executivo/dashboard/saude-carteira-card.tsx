"use client";

import { useState } from "react";
import { AgenciaSegmentoModal } from "@/modules/atribuicoes/components/executivo/dashboard/agencia-segmento-modal";
import { cn } from "@/lib/utils";
import type { SegmentoSaude } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface SaudeCarteiraCardProps {
  segmentos: SegmentoSaude[];
}

const CORES: Record<SegmentoSaude["chave"], string> = {
  ativas: "text-success bg-success/5 border-success/20 hover:bg-success/10",
  potenciais: "text-info bg-info/10 border-info/20 hover:bg-info/15",
  ociosas: "text-warning bg-warning/5 border-warning/20 hover:bg-warning/10",
  inativas: "text-destructive bg-destructive/5 border-destructive/20 hover:bg-destructive/10",
};

// SegmentedHealthCard (SPEC 4.8) — 4 cards clicáveis, cada um abre o
// modal padrão "ver lista" com as agências daquele segmento. Dados reais,
// via SST (ver executivoDashboardSstService.construirSaudeCarteira) —
// segmentação por recência de venda + status cadastral da agência, não
// por limite de crédito (conceito bloqueado, "ativas c/ crédito"/
// "potenciais s/ limite" da SPEC original não existem no schema do SICA;
// ver comentário na função pra detalhe).
export function SaudeCarteiraCard({ segmentos }: SaudeCarteiraCardProps) {
  const [segmentoAberto, setSegmentoAberto] = useState<SegmentoSaude | null>(null);

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-sm font-semibold">Saúde da carteira</h3>
          <p className="text-muted-foreground text-xs">
            Segmenta as agências aprovadas em 4 grupos para priorizar ações.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {segmentos.map((segmento) => (
          <button
            key={segmento.chave}
            type="button"
            onClick={() => setSegmentoAberto(segmento)}
            className={cn(
              "rounded-xl border p-4 text-left transition duration-150 hover:-translate-y-0.5 hover:shadow-md",
              CORES[segmento.chave],
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                {segmento.label}
              </span>
              <span className="text-[11px] font-medium underline-offset-2 opacity-80">
                ▾ ver lista
              </span>
            </div>
            <p className="mt-1 text-lg font-bold">
              {segmento.quantidade} <span className="text-sm">({segmento.pct}%)</span>
            </p>
            <p className="text-xs opacity-80">{segmento.descricao}</p>
          </button>
        ))}
      </div>

      <AgenciaSegmentoModal
        aberto={segmentoAberto !== null}
        onOpenChange={(aberto) => !aberto && setSegmentoAberto(null)}
        titulo={segmentoAberto?.label ?? ""}
        agencias={segmentoAberto?.agencias ?? []}
      />
    </div>
  );
}
