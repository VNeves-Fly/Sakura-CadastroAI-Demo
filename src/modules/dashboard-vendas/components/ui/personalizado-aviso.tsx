import { Info } from "lucide-react";

// Aviso do filtro "Personalizado" — mostrado enquanto o cálculo real por
// intervalo de datas não existe (exigiria consulta nova no back-end,
// fora do escopo atual, que é só front-end; decisão do usuário,
// 2026-08-18). `periodoPreviaLabel` é o período cujo dado real está
// sendo mostrado como prévia (ex.: "Este mês").
export function PersonalizadoAviso({ periodoPreviaLabel }: { periodoPreviaLabel: string }) {
  return (
    <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
      <Info className="size-3.5 shrink-0" />
      Prévia com os dados de &ldquo;{periodoPreviaLabel}&rdquo; — filtro por intervalo de datas
      ainda não conectado a um cálculo real.
    </p>
  );
}
