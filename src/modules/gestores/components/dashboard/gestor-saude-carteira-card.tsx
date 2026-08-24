"use client";

import { useState } from "react";
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

// Card "Saúde da carteira" (SPEC 3.10) — segmentação real, agregada de
// gestorDashboardController (soma de construirSaudeCarteira por
// executivo, via SST); só cai pro mock determinístico se o SST falhar
// pra algum executivo (fallback silencioso, mesma convenção do resto do
// dashboard — sem badge "MK" pra esse caso, ver executivo-dashboard.
// sst-service.ts). Pixel-idêntico ao mesmo card do dashboard de
// Executivo — a barra segmentada que existia aqui antes foi removida
// (não faz parte do layout aprovado, pedido do usuário, 2026-08-21).
export function GestorSaudeCarteiraCard({ segmentos }: GestorSaudeCarteiraCardProps) {
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
