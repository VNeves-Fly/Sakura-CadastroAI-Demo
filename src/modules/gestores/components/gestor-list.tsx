import Link from "next/link";
import type { GestorView } from "@/modules/gestores/types/gestor.types";

interface GestorListProps {
  gestores: GestorView[];
  isLoading: boolean;
  error: string | null;
}

export function GestorList({ gestores, isLoading, error }: GestorListProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando gestores...</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (gestores.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum gestor cadastrado ainda.</p>;
  }

  return (
    <ul className="divide-border border-border bg-card flex flex-col divide-y rounded-[1.5rem] border">
      {gestores.map((gestor) => (
        <li key={gestor.id} className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/gestores/${gestor.id}`}
              className="text-foreground text-sm font-medium hover:underline"
            >
              {gestor.nome}
            </Link>
            <span className="text-muted-foreground text-xs">{gestor.email ?? "sem e-mail"}</span>
            {gestor.bases.length > 0 ? (
              <span className="text-muted-foreground text-xs">{gestor.bases.join(", ")}</span>
            ) : null}
          </div>
          <span
            className={
              gestor.temAcesso
                ? "bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
                : "bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
            }
          >
            {gestor.temAcesso ? "Com acesso" : "Sem acesso"}
          </span>
        </li>
      ))}
    </ul>
  );
}
