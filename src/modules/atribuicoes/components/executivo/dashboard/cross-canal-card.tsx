"use client";

import { useState } from "react";
import { Plane, Bus, Layers } from "lucide-react";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { AgenciaSegmentoModal } from "@/modules/atribuicoes/components/executivo/dashboard/agencia-segmento-modal";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type {
  AgenciaSegmentoResumo,
  CrossCanal,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface CrossCanalCardProps {
  crossCanal: CrossCanal;
}

// Card "Cross-canal — agências do executivo" (SPEC 4.7) — todos os valores
// são mock (ativasUltimos12m, volAereo, volTerrestre, quantidades de canais
// derivados de hash do promotor ID); apenas "aprovadas" (total de agências)
// é real. Os nomes/CNPJs das agências nos modais são também mock-gerados.
export function CrossCanalCard({ crossCanal }: CrossCanalCardProps) {
  const [segmentoAberto, setSegmentoAberto] = useState<{
    titulo: string;
    agencias: AgenciaSegmentoResumo[];
  } | null>(null);

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-foreground text-sm font-semibold">
              Cross-canal — agências do executivo
            </h3>
            <MockBadge />
          </div>
          <p className="text-muted-foreground text-xs">
            Agências que compraram nos últimos 12 meses ·{" "}
            <SensitiveValue value={crossCanal.ativasUltimos12m} /> ativas de{" "}
            <SensitiveValue value={crossCanal.aprovadas} /> aprovadas
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="text-muted-foreground">
            Vol. Aéreo:{" "}
            <span className="text-foreground font-medium">
              <SensitiveValue value={formatarMoedaAbreviada(crossCanal.volAereo)} />
            </span>
          </p>
          <p className="text-muted-foreground">
            Vol. Terrestre:{" "}
            <span className="text-foreground font-medium">
              <SensitiveValue value={formatarMoedaAbreviada(crossCanal.volTerrestre)} />
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CanalBloco
          icon={Plane}
          label="Só aéreo"
          quantidade={crossCanal.soAereo.quantidade}
          pct={crossCanal.soAereo.pct}
          onClick={() =>
            setSegmentoAberto({ titulo: "Só aéreo", agencias: crossCanal.soAereo.agencias })
          }
        />
        <CanalBloco
          icon={Bus}
          label="Só terrestre"
          quantidade={crossCanal.soTerrestre.quantidade}
          pct={crossCanal.soTerrestre.pct}
          onClick={() =>
            setSegmentoAberto({ titulo: "Só terrestre", agencias: crossCanal.soTerrestre.agencias })
          }
        />
        <CanalBloco
          icon={Layers}
          label="Ambos os canais"
          quantidade={crossCanal.ambos.quantidade}
          pct={crossCanal.ambos.pct}
          destaque
          onClick={() =>
            setSegmentoAberto({ titulo: "Ambos os canais", agencias: crossCanal.ambos.agencias })
          }
        />
      </div>

      <AgenciaSegmentoModal
        aberto={segmentoAberto !== null}
        onOpenChange={(aberto) => !aberto && setSegmentoAberto(null)}
        titulo={segmentoAberto?.titulo ?? ""}
        agencias={segmentoAberto?.agencias ?? []}
      />
    </div>
  );
}

function CanalBloco({
  icon: Icon,
  label,
  quantidade,
  pct,
  destaque,
  onClick,
}: {
  icon: typeof Plane;
  label: string;
  quantidade: number;
  pct: number;
  destaque?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        destaque
          ? "bg-success/5 border-success/20 hover:bg-success/10 flex items-center gap-3 rounded-xl border p-4 text-left transition"
          : "border-border hover:bg-muted/40 flex items-center gap-3 rounded-xl border p-4 text-left transition"
      }
    >
      <Icon className="text-muted-foreground size-5" />
      <div>
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          {label}
        </p>
        <p className="text-foreground text-lg font-bold">
          <SensitiveValue value={quantidade} /> <span className="text-sm">({pct}%)</span>
        </p>
      </div>
    </button>
  );
}
