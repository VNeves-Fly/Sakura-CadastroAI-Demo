import { Plane } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { formatarMoedaCompleta } from "@/modules/agencias-crm/utils/formatar-moeda.util";
import type { TopCompanhiaAgencia } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaTopCompanhiasCardProps {
  companhias: TopCompanhiaAgencia[];
}

// Cor institucional real por companhia (SPEC seção 3.5.B) — fallback pra
// var(--color-primary) quando a companhia não está no mapa.
const CORES: Record<string, string> = {
  Gol: "#FF7020",
  Azul: "#0033A0",
  Latam: "#E30613",
  Iberia: "#D7192D",
  Lufthansa: "#05164D",
  "Air France": "#002157",
  "United Airlines": "#1414AF",
  "Tap Portugal": "#00A04B",
};

// Card "Top Companhias Aéreas" (SPEC seção 3.5.B) — `companhias` vem de
// `vendas.topCompanhias` (mock determinístico, ver agencia-detalhe.adapter.ts,
// mesmo dado que já existia no antigo modal), aqui só reestilizado e
// limitado às 8 primeiras.
export function AgenciaTopCompanhiasCard({ companhias }: AgenciaTopCompanhiasCardProps) {
  const top8 = companhias.slice(0, 8);
  const valorMaximo = top8[0]?.volume ?? 1;

  return (
    <div className="border-border rounded-xl border p-[18px_20px]">
      <p className="text-foreground flex items-center gap-2 text-sm font-bold">
        <Plane className="text-primary size-4" />
        Top Companhias Aéreas
      </p>
      <p className="text-muted-foreground text-xs">por volume faturado</p>

      <div className="mt-1">
        {top8.map((companhia, indice) => {
          const cor = CORES[companhia.nome] ?? "var(--color-primary)";
          return (
            <div key={companhia.nome} className="border-border border-t py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[13.5px] text-[#1A1A2E]">
                  <span className="text-[12px] text-[#9494AC] tabular-nums">{indice + 1}°</span>
                  {companhia.nome}
                </span>
                <span className="text-[13.5px] font-bold text-[#1A1A2E] tabular-nums">
                  <SensitiveValue value={formatarMoedaCompleta(companhia.volume)} />
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F2F2F8]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, Math.round((companhia.volume / valorMaximo) * 100))}%`,
                    background: cor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
