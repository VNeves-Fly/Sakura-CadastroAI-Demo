import type {
  SituacaoAgenciaNova,
  SituacaoConfig,
} from "@/modules/novas-agencias/types/novas-agencias.types";

// Mapa situação -> {label, cor} (SPEC 9.1) — cores exatas em rgba/hex
// literais da SPEC, por isso `style` inline em vez de classe Tailwind
// (mesmo padrão de cor dinâmica já usado no projeto, ex. kpi-card.tsx).
const CONFIG: Record<SituacaoAgenciaNova, SituacaoConfig> = {
  nunca: {
    label: "Nunca comprou (sem login)",
    bg: "rgba(239,68,68,0.10)",
    cor: "#DC2626",
  },
  logou: {
    label: "Logou, nunca comprou",
    bg: "rgba(245,158,11,0.12)",
    cor: "#B45309",
  },
  comprando: {
    label: "Comprando (90d)",
    bg: "rgba(16,185,129,0.12)",
    cor: "#047857",
  },
  parou: {
    label: "Parou de comprar (+90d)",
    bg: "rgba(233,30,140,0.10)",
    cor: "#C2185B",
  },
};

export function StatusBadge({ situacao }: { situacao: SituacaoAgenciaNova }) {
  const config = CONFIG[situacao];
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: config.bg, color: config.cor }}
    >
      {config.label}
    </span>
  );
}
