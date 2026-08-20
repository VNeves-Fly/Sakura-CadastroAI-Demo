"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { SortableDataTable } from "@/modules/shared/components/sortable-data-table";
import { cn } from "@/lib/utils";
import { formatarMoedaAbreviada } from "@/modules/gestores/utils/formatar-moeda.util";
import type { AcaoPrioritariaAgencia } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorAcoesPrioritariasCardProps {
  paradasComHistorico: AcaoPrioritariaAgencia[];
  emQueda: AcaoPrioritariaAgencia[];
  verListaCompletaHref?: string;
}

const TAMANHO_VISIVEL = 10;

function badgeSemComprar(dias: number) {
  if (dias > 150) {
    return <Badge variant="destructive">{dias} dias</Badge>;
  }
  if (dias > 100) {
    return (
      <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
        {dias} dias
      </Badge>
    );
  }
  return <Badge variant="outline">{dias} dias</Badge>;
}

// Card "Ações prioritárias" — todos os valores são mock-gerados (volume365d,
// diasSemComprar derivados de hash do agência ID); nomes/CNPJs das agências
// e base (do executivo dono) são reais. Não existe no dashboard de Executivo
// (que usa dois RiscoCollapsivel separados, sem toggle). Aqui é um único card
// com alternância entre os dois critérios (SPEC pedida pelo usuário,
// 2026-08-17), limitado às 10 primeiras linhas + "Mostrando X de Y".
export function GestorAcoesPrioritariasCard({
  paradasComHistorico,
  emQueda,
  verListaCompletaHref,
}: GestorAcoesPrioritariasCardProps) {
  const [aba, setAba] = useState<"paradas" | "queda">("paradas");
  const linhas = aba === "paradas" ? paradasComHistorico : emQueda;
  const visiveis = linhas.slice(0, TAMANHO_VISIVEL);

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="text-warning size-4" />
            Ações prioritárias
          </h3>
          <p className="text-muted-foreground text-xs">
            Agências paradas com histórico de compra — priorizar visita/contato
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <MockBadge />
          <div className="bg-muted flex items-center gap-1 rounded-full p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAba("paradas")}
              className={cn(
                "rounded-full px-3 py-1.5 whitespace-nowrap transition",
                aba === "paradas"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Paradas com histórico
            </button>
            <button
              type="button"
              onClick={() => setAba("queda")}
              className={cn(
                "rounded-full px-3 py-1.5 whitespace-nowrap transition",
                aba === "queda"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Em queda
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <SortableDataTable
          columns={[
            {
              key: "nome",
              label: "Agência",
              render: (linha) => (
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">{linha.nome}</span>
                  <span className="text-muted-foreground font-mono text-xs">{linha.cnpj}</span>
                </div>
              ),
            },
            {
              key: "base",
              label: "Base",
              render: (linha) => <span className="text-muted-foreground">{linha.base ?? "—"}</span>,
            },
            {
              key: "volume365d",
              label: "Volume 365D",
              align: "right",
              render: (linha) => (
                <SensitiveValue value={formatarMoedaAbreviada(linha.volume365d)} />
              ),
            },
            {
              key: "diasSemComprar",
              label: "Sem comprar",
              align: "right",
              render: (linha) => <SensitiveValue value={badgeSemComprar(linha.diasSemComprar)} />,
            },
          ]}
          rows={visiveis}
          rowKey={(linha) => linha.cnpj}
          emptyMessage="Nenhuma agência encontrada."
        />
      </div>

      <div className="border-border mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
        <p className="text-muted-foreground">
          Mostrando {visiveis.length} de {linhas.length}
        </p>
        {verListaCompletaHref ? (
          <Link href={verListaCompletaHref} className="text-primary font-medium hover:underline">
            Ver lista completa →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
