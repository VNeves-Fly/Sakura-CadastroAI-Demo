"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

interface TvHeaderProps {
  // Reflete se o último polling (ver tv-view.tsx) conseguiu buscar dado
  // novo com sucesso — dado sempre vem de tv.mock-service.ts (repositório
  // de demonstração); só sinaliza problema de conectividade/API na rota
  // de polling em si, não a origem do dado.
  syncOk: boolean;
}

function formatarRelogio(data: Date): string {
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatarDataExtenso(data: Date): string {
  const formatado = data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Intl já devolve minúsculo em pt-BR pra weekday/month, mas o "de"
  // entre dia/mês/ano precisa do formato "quinta-feira, 20 de agosto de
  // 2026" — toLocaleDateString com esses campos já monta nesse formato.
  return formatado;
}

// Relógio ao vivo (client-side, tick de 1s) + data por extenso + selo de
// sincronismo — seção 5 do spec da página /tv. `new Date()` só dentro de
// `useEffect`/`useState` (nunca no corpo do componente) pra não gerar
// hydration mismatch entre o render do servidor e o primeiro render do
// cliente.
export function TvHeader({ syncOk }: TvHeaderProps) {
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
    const intervalo = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-foreground text-xl font-bold sm:text-2xl">Fast View</h1>
        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Atualizado em tempo real</p>
      </div>

      <div className="text-right">
        <div className="text-foreground text-2xl leading-none font-bold tabular-nums sm:text-[2.2rem]">
          {agora ? formatarRelogio(agora) : "--:--:--"}
        </div>
        <div className="text-muted-foreground mt-1 text-[0.7rem] font-medium tracking-widest uppercase sm:text-xs">
          {agora ? formatarDataExtenso(agora) : ""}
        </div>
        <div
          className={
            syncOk
              ? "text-success mt-1 flex items-center justify-end gap-1 text-xs font-semibold"
              : "text-destructive mt-1 flex animate-pulse items-center justify-end gap-1 text-xs font-semibold"
          }
        >
          {syncOk ? <CircleCheck className="size-3.5" /> : <CircleAlert className="size-3.5" />}
          <span>{syncOk ? "sync ok" : "sync falha"}</span>
        </div>
      </div>
    </div>
  );
}
