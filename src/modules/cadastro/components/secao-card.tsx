import type { ReactNode } from "react";

interface SecaoCardProps {
  numero: number;
  titulo: string;
  concluida: boolean;
  children: ReactNode;
}

export function SecaoCard({ numero, titulo, concluida, children }: SecaoCardProps) {
  return (
    <div className="border-border bg-card flex flex-col gap-5 rounded-2xl border p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            concluida ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {concluida ? "✓" : numero}
        </span>
        <h2 className="text-foreground text-base font-bold">{titulo}</h2>
      </div>
      {children}
    </div>
  );
}
