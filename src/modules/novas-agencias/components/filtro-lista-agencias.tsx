"use client";

import { Check, Search } from "lucide-react";
import { SelectField } from "@/components/ui/select-field";
import { cn } from "@/lib/utils";
import type { SituacaoAgencia } from "@/modules/novas-agencias/types/novas-agencias.types";

export interface FiltrosListaAgencias {
  busca: string;
  situacao: SituacaoAgencia | "todas";
  executivo: string;
  gerente: string;
  credito: "todos" | "com" | "sem";
  apenasCompraram: boolean;
}

interface FiltroListaAgenciasProps {
  filtros: FiltrosListaAgencias;
  onAtualizarFiltro: <K extends keyof FiltrosListaAgencias>(
    chave: K,
    valor: FiltrosListaAgencias[K],
  ) => void;
  opcoesExecutivo: string[];
  opcoesGerente: string[];
}

const OPCOES_SITUACAO: { value: string; label: string }[] = [
  { value: "todas", label: "Todas as situações" },
  { value: "comprando", label: "Comprando (90d)" },
  { value: "logou_nunca_comprou", label: "Logou, nunca comprou" },
  { value: "nunca_comprou", label: "Nunca comprou (sem login)" },
  { value: "parou_comprar", label: "Parou de comprar (+90d)" },
];

const OPCOES_CREDITO: { value: string; label: string }[] = [
  { value: "todos", label: "Crédito: todos" },
  { value: "com", label: "Com limite faturado" },
  { value: "sem", label: "Sem limite faturado" },
];

// Barra de filtros da seção "Lista de agências" (SPEC 8.2) — busca +
// 4 selects + checkbox, tudo client-side sobre o array mock já em
// memória (sem refetch).
export function FiltroListaAgencias({
  filtros,
  onAtualizarFiltro,
  opcoesExecutivo,
  opcoesGerente,
}: FiltroListaAgenciasProps) {
  const opcoesExecutivoField = [
    { value: "todos", label: "Todos os executivos" },
    ...opcoesExecutivo.map((nome) => ({ value: nome, label: nome })),
  ];
  const opcoesGerenteField = [
    { value: "todos", label: "Todos os gerentes" },
    ...opcoesGerente.map((nome) => ({ value: nome, label: nome })),
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative max-w-xs flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input
          type="text"
          value={filtros.busca}
          onChange={(evento) => onAtualizarFiltro("busca", evento.target.value)}
          placeholder="Nome, CNPJ ou ID ERP..."
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 h-9 w-full rounded-md border pl-9 text-sm outline-none focus:ring-2"
        />
      </div>

      <SelectField
        className="w-auto shrink-0 whitespace-nowrap"
        options={OPCOES_SITUACAO}
        value={filtros.situacao}
        onValueChange={(valor) =>
          onAtualizarFiltro("situacao", (valor as SituacaoAgencia | "todas") ?? "todas")
        }
      />
      <SelectField
        className="w-auto shrink-0 whitespace-nowrap"
        options={opcoesExecutivoField}
        value={filtros.executivo}
        onValueChange={(valor) => onAtualizarFiltro("executivo", valor ?? "todos")}
      />
      <SelectField
        className="w-auto shrink-0 whitespace-nowrap"
        options={opcoesGerenteField}
        value={filtros.gerente}
        onValueChange={(valor) => onAtualizarFiltro("gerente", valor ?? "todos")}
      />
      <SelectField
        className="w-auto shrink-0 whitespace-nowrap"
        options={OPCOES_CREDITO}
        value={filtros.credito}
        onValueChange={(valor) =>
          onAtualizarFiltro("credito", (valor as "todos" | "com" | "sem") ?? "todos")
        }
      />

      <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm select-none">
        <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={filtros.apenasCompraram}
            onChange={(evento) => onAtualizarFiltro("apenasCompraram", evento.target.checked)}
            className="absolute inset-0 size-4 cursor-pointer opacity-0"
          />
          <span
            className={cn(
              "border-primary flex size-4 items-center justify-center rounded-[4px] border transition",
              filtros.apenasCompraram ? "bg-primary" : "bg-card",
            )}
          >
            {filtros.apenasCompraram ? <Check className="size-3 text-white" /> : null}
          </span>
        </span>
        Apenas agências que compraram
      </label>
    </div>
  );
}
