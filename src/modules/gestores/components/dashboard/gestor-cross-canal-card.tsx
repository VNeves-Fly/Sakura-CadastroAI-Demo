"use client";

import { useState } from "react";
import { Plane, Bus, Layers } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { GestorAgenciaSegmentoModal } from "@/modules/gestores/components/dashboard/gestor-agencia-segmento-modal";
import { formatarMoedaAbreviada } from "@/modules/gestores/utils/formatar-moeda.util";
import type {
  AgenciaSegmentoResumo,
  CrossCanal,
} from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorCrossCanalCardProps {
  crossCanal: CrossCanal;
}

// Card "Cross-canal — 12 meses" — os 3 blocos são clicáveis e abrem o
// modal padrão de "ver lista" com as agências daquele segmento (mock).
export function GestorCrossCanalCard({ crossCanal }: GestorCrossCanalCardProps) {
  const [segmentoAberto, setSegmentoAberto] = useState<{
    titulo: string;
    agencias: AgenciaSegmentoResumo[];
  } | null>(null);

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-foreground text-sm font-semibold">Cross-canal — 12 meses</h3>
          <p className="text-muted-foreground text-xs">
            <SensitiveValue value={crossCanal.ativasUltimos12m} /> agências ativas de{" "}
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
          label="Ambos"
          quantidade={crossCanal.ambos.quantidade}
          pct={crossCanal.ambos.pct}
          destaque
          onClick={() =>
            setSegmentoAberto({ titulo: "Ambos os canais", agencias: crossCanal.ambos.agencias })
          }
        />
      </div>

      <GestorAgenciaSegmentoModal
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
