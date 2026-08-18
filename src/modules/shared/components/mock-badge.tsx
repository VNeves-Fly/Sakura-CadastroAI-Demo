import { cn } from "@/lib/utils";

interface MockBadgeProps {
  className?: string;
}

// Selo visual "MK" — sinaliza que os dados desta seção/card ainda são
// mock (não vêm do banco de dados) — ver documentação sobre dados reais
// vs mockados no projeto. Mesma paleta de "warning" do resto do
// dashboard, pra não introduzir uma cor nova.
export function MockBadge({ className }: MockBadgeProps) {
  return (
    <span
      title="Dado mockado — ainda não vem do banco de dados"
      className={cn(
        "bg-warning-bg text-warning-text shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        className,
      )}
    >
      MK
    </span>
  );
}
