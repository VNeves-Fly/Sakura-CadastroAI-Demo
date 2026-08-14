import { Plane, Bus, Layers } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type { CrossCanal } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface CrossCanalCardProps {
  crossCanal: CrossCanal;
}

// Card "Cross-canal — agências do executivo" (SPEC 4.7).
export function CrossCanalCard({ crossCanal }: CrossCanalCardProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-foreground text-sm font-semibold">
            Cross-canal — agências do executivo
          </h3>
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
        />
        <CanalBloco
          icon={Bus}
          label="Só terrestre"
          quantidade={crossCanal.soTerrestre.quantidade}
          pct={crossCanal.soTerrestre.pct}
        />
        <CanalBloco
          icon={Layers}
          label="Ambos os canais"
          quantidade={crossCanal.ambos.quantidade}
          pct={crossCanal.ambos.pct}
          destaque
        />
      </div>
    </div>
  );
}

function CanalBloco({
  icon: Icon,
  label,
  quantidade,
  pct,
  destaque,
}: {
  icon: typeof Plane;
  label: string;
  quantidade: number;
  pct: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={
        destaque
          ? "bg-success/5 border-success/20 flex items-center gap-3 rounded-xl border p-4"
          : "border-border flex items-center gap-3 rounded-xl border p-4"
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
    </div>
  );
}
