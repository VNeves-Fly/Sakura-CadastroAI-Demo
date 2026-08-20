import { Badge } from "@/components/ui/badge";
import type { SituacaoAgencia } from "@/modules/novas-agencias/types/novas-agencias.types";

// Mapa situação -> {label, cor} (SPEC 8.4) — "logou_nunca_comprou" e
// "parou_comprar" usam cores marcadas como estimativa visual na SPEC
// (a imagem original não deixava a cor exata clara pra essas duas).
const CONFIG: Record<SituacaoAgencia, { label: string; className: string }> = {
  nunca_comprou: {
    label: "Nunca comprou (sem login)",
    className: "bg-red-50 text-red-600",
  },
  comprando: {
    label: "Comprando (90d)",
    className: "bg-green-50 text-green-700",
  },
  logou_nunca_comprou: {
    label: "Logou, nunca comprou",
    className: "bg-orange-50 text-orange-600",
  },
  parou_comprar: {
    label: "Parou de comprar (+90d)",
    className: "bg-red-100 text-red-700",
  },
};

export function StatusBadge({ situacao }: { situacao: SituacaoAgencia }) {
  const config = CONFIG[situacao];
  return (
    <Badge variant="outline" className={`border-transparent ${config.className}`}>
      {config.label}
    </Badge>
  );
}
