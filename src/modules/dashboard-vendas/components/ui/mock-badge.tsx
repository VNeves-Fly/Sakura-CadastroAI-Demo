import { cn } from "@/lib/utils";

interface MockBadgeProps {
  className?: string;
}

// Selo visual "MK" — sinaliza que os dados desta seção/card ainda são
// mock (não vêm do SST) — ver docs/faltante.md pra saber o que falta pra
// virar real. Mesma paleta de "warning" do resto do dashboard (ver
// CollapsiblePanel/TOM_CLASSES), pra não introduzir uma cor nova.
export function MockBadge({ className }: MockBadgeProps) {
  return (
    <span
      title="Dado mockado — ainda não vem do SST (ver docs/faltante.md)"
      className={cn(
        "bg-warning-bg text-warning-text shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        className,
      )}
    >
      MK
    </span>
  );
}
