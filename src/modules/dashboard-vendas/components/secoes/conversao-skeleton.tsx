import {
  Activity,
  Building2,
  Info,
  Search,
  Ticket,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingBall } from "@/components/ui/loading-ball";
import { COR_ROSA } from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";

// Placeholder de ConversaoPanel (ver conversao-panel.tsx) enquanto
// obterConversao() resolve via Suspense. Ícones/labels são texto estático;
// só o percentual/variação de cada indicador vira LoadingBall e o
// subtítulo "Comparando ..." (depende do período comparativo do SST) vira
// Skeleton.

function CardIndicadorSkeleton({
  icon: Icon,
  label,
  destaque,
  comSubtitulo,
  comTotalClientes,
}: {
  icon: LucideIcon;
  label: string;
  destaque?: boolean;
  comSubtitulo?: boolean;
  comTotalClientes?: boolean;
}) {
  return (
    <div className="border-border bg-card relative flex flex-col gap-1 rounded-2xl border p-4">
      <span className="text-muted-foreground absolute top-3 right-3">
        <Search className="size-3.5" />
      </span>
      <Icon className="size-4" style={{ color: destaque ? COR_ROSA : "var(--muted-foreground)" }} />
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{label}</p>
      <div className="flex h-[1.9em] items-center">
        <LoadingBall size="lg" />
      </div>
      {comSubtitulo ? <Skeleton className="h-3 w-28" /> : null}
      {comTotalClientes ? (
        <div className="mt-auto self-end">
          <LoadingBall size="xs" />
        </div>
      ) : null}
    </div>
  );
}

export function ConversaoSkeleton() {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-center gap-2">
        <Activity className="text-muted-foreground size-4 shrink-0" />
        <h2 className="text-foreground text-sm font-semibold">Conversão</h2>
        <Info className="text-muted-foreground size-3.5" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardIndicadorSkeleton icon={Activity} label="Saúde" destaque comTotalClientes />
        <CardIndicadorSkeleton icon={TrendingUp} label="Volume Mês (A+T)" comSubtitulo />
        <CardIndicadorSkeleton icon={Ticket} label="Bilhetes/Vendas Mês" comSubtitulo />
        <CardIndicadorSkeleton icon={Building2} label="Agências Mês" comSubtitulo />
      </div>
    </div>
  );
}
