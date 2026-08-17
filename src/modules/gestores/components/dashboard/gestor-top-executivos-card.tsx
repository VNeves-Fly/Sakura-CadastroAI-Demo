import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { cn } from "@/lib/utils";
import type { RankingExecutivoSaude } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorTopExecutivosCardProps {
  titulo: string;
  subtitulo: string;
  icon: LucideIcon;
  iconClassName?: string;
  ranking: RankingExecutivoSaude[];
  corBarra: string;
}

// Ranking de executivos por % de agências vendendo nos últimos 30d — não
// existe equivalente no dashboard de Executivo (um executivo não tem
// subordinados); componente novo pro dashboard de Gestor.
export function GestorTopExecutivosCard({
  titulo,
  subtitulo,
  icon: Icon,
  iconClassName,
  ranking,
  corBarra,
}: GestorTopExecutivosCardProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
        <Icon className={cn("size-4", iconClassName)} />
        {titulo}
      </h3>
      <p className="text-muted-foreground text-xs">{subtitulo}</p>

      {ranking.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">Nenhum executivo na carteira.</p>
      ) : (
        <ol className="divide-border mt-3 flex flex-col divide-y">
          {ranking.map((item) => (
            <li key={item.id}>
              <Link
                href={`/crm/executivos/${item.id}`}
                className="hover:bg-muted/40 -mx-1 flex items-center justify-between gap-3 rounded-lg px-1 py-2.5 text-sm transition"
              >
                <span className="text-foreground truncate font-medium uppercase">{item.nome}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    <SensitiveValue value={`${item.vendendo}/${item.total}`} />
                  </span>
                  <span className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
                    <span
                      className={cn("block h-full rounded-full", corBarra)}
                      style={{ width: `${Math.min(100, item.pct)}%` }}
                    />
                  </span>
                  <span className="text-foreground w-10 text-right text-xs font-semibold tabular-nums">
                    {item.pct}%
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
