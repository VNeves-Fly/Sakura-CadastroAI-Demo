"use client";

import { Filter } from "lucide-react";
import { BuscaListaInput } from "@/modules/shared/components/busca-lista-input";
import { cn } from "@/lib/utils";
import type { AgenciasCarteiraFiltros } from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasToolbarProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  ordenarPor: AgenciasCarteiraFiltros["ordenarPor"];
  onTopVendasChange: (valor: "vendasAno" | "vendasMes") => void;
  quantidadeFiltrosAtivos: number;
  painelFiltrosAberto: boolean;
  onTogglePainelFiltros: () => void;
  atualizadoEm: string;
}

// Barra de controle superior da listagem (SPEC seções 2.3 e 3.1) —
// "Financial Adapter — Atualizado em..." é texto informativo estático
// (não existe fonte de "última sincronização" real pra essa listagem
// hoje; ver observação de escala no loader deste módulo).
export function AgenciasToolbar({
  busca,
  onBuscaChange,
  ordenarPor,
  onTopVendasChange,
  quantidadeFiltrosAtivos,
  painelFiltrosAberto,
  onTogglePainelFiltros,
  atualizadoEm,
}: AgenciasToolbarProps) {
  const topVendas: "vendasAno" | "vendasMes" =
    ordenarPor === "vendasMes" ? "vendasMes" : "vendasAno";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          Financial Adapter — Atualizado em {atualizadoEm}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">Top vendas:</span>
          <div className="bg-muted inline-flex rounded-full p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onTopVendasChange("vendasAno")}
              className={cn(
                "rounded-full px-3 py-1.5 transition",
                topVendas === "vendasAno"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Ano
            </button>
            <button
              type="button"
              onClick={() => onTopVendasChange("vendasMes")}
              className={cn(
                "rounded-full px-3 py-1.5 transition",
                topVendas === "vendasMes"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Mês
            </button>
          </div>

          <button
            type="button"
            onClick={onTogglePainelFiltros}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
              painelFiltrosAberto
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-foreground hover:bg-accent",
            )}
          >
            <Filter className="size-3.5" />
            Filtros{quantidadeFiltrosAtivos > 0 ? ` (${quantidadeFiltrosAtivos})` : ""}
          </button>
        </div>
      </div>

      <BuscaListaInput
        value={busca}
        onChange={onBuscaChange}
        placeholder='Buscar CNPJ, razão social, executivo... ou digite "críticos"'
        className="max-w-none"
      />
    </div>
  );
}
