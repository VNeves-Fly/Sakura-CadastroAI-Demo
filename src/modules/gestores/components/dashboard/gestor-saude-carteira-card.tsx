"use client";

import { useState } from "react";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { GestorAgenciaSegmentoModal } from "@/modules/gestores/components/dashboard/gestor-agencia-segmento-modal";
import { cn } from "@/lib/utils";
import type { SegmentoSaude } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorSaudeCarteiraCardProps {
  segmentos: SegmentoSaude[];
}

const CORES: Record<SegmentoSaude["chave"], string> = {
  ativas: "text-success bg-success/5 border-success/20 hover:bg-success/10",
  potenciais: "text-info bg-info/10 border-info/20 hover:bg-info/15",
  ociosas: "text-warning bg-warning/5 border-warning/20 hover:bg-warning/10",
  inativas: "text-destructive bg-destructive/5 border-destructive/20 hover:bg-destructive/10",
};

const COR_BARRA: Record<SegmentoSaude["chave"], string> = {
  ativas: "bg-success",
  potenciais: "bg-info",
  ociosas: "bg-warning",
  inativas: "bg-muted-foreground/40",
};

// Card "Saúde da carteira" — todos os valores são mock-gerados (segmentação,
// quantidades, percentuais derivados de hash do gestor ID); nomes/CNPJs das
// agências nos modais são também mock. Mesmo componente do dashboard de
// Executivo, com uma barra segmentada acima dos 4 cards mostrando a proporção
// de cada grupo de uma vez só (SPEC pedida pelo usuário, 2026-08-17).
export function GestorSaudeCarteiraCard({ segmentos }: GestorSaudeCarteiraCardProps) {
  const [segmentoAberto, setSegmentoAberto] = useState<SegmentoSaude | null>(null);
  const totalAprovadas = segmentos.reduce((total, segmento) => total + segmento.quantidade, 0);

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-sm font-semibold">Saúde da carteira</h3>
          <p className="text-muted-foreground text-xs">
            <SensitiveValue value={totalAprovadas} /> agências aprovadas segmentadas em 4 grupos
            para priorizar ação
          </p>
        </div>
        <MockBadge />
      </div>

      <div className="bg-muted mt-4 flex h-2 w-full overflow-hidden rounded-full">
        {segmentos.map((segmento) => (
          <span
            key={segmento.chave}
            className={COR_BARRA[segmento.chave]}
            style={{ width: `${segmento.pct}%` }}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {segmentos.map((segmento) => (
          <button
            key={segmento.chave}
            type="button"
            onClick={() => setSegmentoAberto(segmento)}
            className={cn("rounded-xl border p-4 text-left transition", CORES[segmento.chave])}
          >
            <span className="text-[11px] font-semibold tracking-wide uppercase">
              {segmento.label}
            </span>
            <p className="mt-1 text-lg font-bold">
              <SensitiveValue value={segmento.quantidade} />{" "}
              <span className="text-sm">({segmento.pct}%)</span>
            </p>
            <p className="text-xs opacity-80">{segmento.descricao}</p>
          </button>
        ))}
      </div>

      <GestorAgenciaSegmentoModal
        aberto={segmentoAberto !== null}
        onOpenChange={(aberto) => !aberto && setSegmentoAberto(null)}
        titulo={segmentoAberto?.label ?? ""}
        agencias={segmentoAberto?.agencias ?? []}
      />
    </div>
  );
}
