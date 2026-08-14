"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { cn } from "@/lib/utils";
import type { SegmentoSaude } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface SaudeCarteiraCardProps {
  segmentos: SegmentoSaude[];
}

const CORES: Record<SegmentoSaude["chave"], string> = {
  ativas: "text-success bg-success/5 border-success/20",
  potenciais: "text-info bg-info/10 border-info/20",
  ociosas: "text-warning bg-warning/5 border-warning/20",
  inativas: "text-destructive bg-destructive/5 border-destructive/20",
};

// SegmentedHealthCard (SPEC 4.8) — 4 cards clicáveis. O drill-down real
// por agência ainda não existe (os segmentos são derivados de contagem
// agregada mock, sem vínculo agência-a-agência hoje) — o "▾ ver lista"
// abre um aviso honesto em vez de fingir uma lista que não existe.
export function SaudeCarteiraCard({ segmentos }: SaudeCarteiraCardProps) {
  const [expandido, setExpandido] = useState<string | null>(null);

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h3 className="text-foreground text-sm font-semibold">Saúde da carteira</h3>
      <p className="text-muted-foreground text-xs">
        Segmenta as agências aprovadas em 4 grupos para priorizar ações.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {segmentos.map((segmento) => (
          <div key={segmento.chave} className={cn("rounded-xl border p-4", CORES[segmento.chave])}>
            <button
              type="button"
              onClick={() =>
                setExpandido((atual) => (atual === segmento.chave ? null : segmento.chave))
              }
              className="flex w-full items-center justify-between gap-1"
            >
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                {segmento.label}
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 shrink-0 transition-transform",
                  expandido === segmento.chave && "rotate-180",
                )}
              />
            </button>
            <p className="mt-1 text-lg font-bold">
              <SensitiveValue value={segmento.quantidade} />{" "}
              <span className="text-sm">({segmento.pct}%)</span>
            </p>
            <p className="text-xs opacity-80">{segmento.descricao}</p>
            {expandido === segmento.chave ? (
              <p className="mt-2 border-t border-current/20 pt-2 text-xs opacity-70">
                Detalhamento por agência ainda não disponível — depende de dado de venda real por
                agência.
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
