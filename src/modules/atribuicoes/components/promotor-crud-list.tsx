import Link from "next/link";
import type { PromotorCrudView } from "@/modules/atribuicoes/types/promotor-crud.types";

interface PromotorCrudListProps {
  promotores: PromotorCrudView[];
  isLoading: boolean;
  error: string | null;
}

export function PromotorCrudList({ promotores, isLoading, error }: PromotorCrudListProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando executivos...</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (promotores.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum executivo cadastrado ainda.</p>;
  }

  return (
    <ul className="divide-border border-border bg-card flex flex-col divide-y rounded-[1.5rem] border">
      {promotores.map((promotor) => (
        <li key={promotor.id} className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/promotores/${promotor.id}`}
              className="text-foreground text-sm font-medium hover:underline"
            >
              {promotor.nome}
            </Link>
            <span className="text-muted-foreground text-xs">{promotor.email}</span>
            {promotor.bases.length > 0 ? (
              <span className="text-muted-foreground text-xs">{promotor.bases.join(", ")}</span>
            ) : null}
          </div>
          <span
            className={
              promotor.temAcesso
                ? "bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
                : "bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
            }
          >
            {promotor.temAcesso ? "Com acesso" : "Sem acesso"}
          </span>
        </li>
      ))}
    </ul>
  );
}
