import Link from "next/link";
import type { AssociacaoView } from "@/modules/associacoes/types/associacao.types";

interface AssociacaoListProps {
  associacoes: AssociacaoView[];
  isLoading: boolean;
  error: string | null;
}

export function AssociacaoList({ associacoes, isLoading, error }: AssociacaoListProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando associações...</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (associacoes.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma associação cadastrada ainda.</p>;
  }

  return (
    <ul className="divide-border border-border bg-card flex flex-col divide-y rounded-[1.5rem] border">
      {associacoes.map((associacao) => (
        <li key={associacao.id} className="flex items-center justify-between gap-3 px-5 py-3">
          <Link
            href={`/associacoes/${associacao.id}`}
            className="text-foreground text-sm font-medium hover:underline"
          >
            {associacao.nome}
          </Link>
          <span
            className={
              associacao.ativo
                ? "bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
                : "bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
            }
          >
            {associacao.ativo ? "Ativa" : "Inativa"}
          </span>
        </li>
      ))}
    </ul>
  );
}
