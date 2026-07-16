import type { ReactNode } from "react";

interface SecaoCardProps {
  numero: number;
  titulo: string;
  concluida: boolean;
  children: ReactNode;
}

export function SecaoCard({ numero, titulo, concluida, children }: SecaoCardProps) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            concluida ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {concluida ? "✓" : numero}
        </span>
        <h2 className="text-base font-bold text-foreground">{titulo}</h2>
      </div>
      {children}
    </div>
  );
}
