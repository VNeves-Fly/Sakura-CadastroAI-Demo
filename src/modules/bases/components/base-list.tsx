import Link from "next/link";
import type { BaseView } from "@/modules/bases/types/base.types";

interface BaseListProps {
  bases: BaseView[];
  isLoading: boolean;
  error: string | null;
}

export function BaseList({ bases, isLoading, error }: BaseListProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando bases...</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (bases.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma base cadastrada ainda.</p>;
  }

  return (
    <ul className="divide-border border-border bg-card flex flex-col divide-y rounded-[1.5rem] border">
      {bases.map((base) => (
        <li key={base.id} className="flex items-center justify-between gap-3 px-5 py-3">
          <Link
            href={`/bases/${base.id}`}
            className="text-foreground text-sm font-medium hover:underline"
          >
            {base.sigla}
          </Link>
          <span className="text-muted-foreground text-xs">
            {base.nomeCidade} — {base.uf}
          </span>
        </li>
      ))}
    </ul>
  );
}
