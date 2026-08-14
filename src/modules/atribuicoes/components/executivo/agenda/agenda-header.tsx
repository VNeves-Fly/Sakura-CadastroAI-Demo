"use client";

import { CalendarPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AgendaVisao } from "@/modules/atribuicoes/view-models/use-executivo-agenda.view-model";

interface AgendaHeaderProps {
  visao: AgendaVisao;
  onVisaoChange: (visao: AgendaVisao) => void;
  busca: string;
  onBuscaChange: (busca: string) => void;
  onAgendarClick: () => void;
}

const OPCOES: { chave: AgendaVisao; label: string }[] = [
  { chave: "calendario", label: "Calendário" },
  { chave: "kanban", label: "Kanban" },
  { chave: "lista", label: "Lista" },
];

// Header da Agenda (SPEC seção 5) — título + subtítulo à esquerda,
// seletor de visão em pill group + busca à direita. O botão "Agendar
// visita" fica aqui (não dentro de cada visão) justamente pra estar
// disponível nas 3 modalidades (Calendário/Kanban/Lista) sem duplicar.
export function AgendaHeader({
  visao,
  onVisaoChange,
  busca,
  onBuscaChange,
  onAgendarClick,
}: AgendaHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-foreground text-lg font-semibold">Agenda do Executivo</h2>
        <p className="text-muted-foreground text-xs">
          Calendário, Kanban e carteira com financeiro do mês
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-muted inline-flex rounded-full p-1 text-sm">
          {OPCOES.map((opcao) => (
            <button
              key={opcao.chave}
              type="button"
              onClick={() => onVisaoChange(opcao.chave)}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-medium transition",
                visao === opcao.chave
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opcao.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-[220px]">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={busca}
            onChange={(event) => onBuscaChange(event.target.value)}
            placeholder="Buscar agência..."
            className="rounded-full pl-8"
          />
        </div>

        <button
          type="button"
          onClick={onAgendarClick}
          className="bg-primary text-primary-foreground hover:bg-sakura-600 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap"
        >
          <CalendarPlus className="size-4" />
          Agendar visita
        </button>
      </div>
    </div>
  );
}
