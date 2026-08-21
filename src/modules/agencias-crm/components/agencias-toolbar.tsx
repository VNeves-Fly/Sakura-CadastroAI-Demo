"use client";

import { BuscaListaInput } from "@/modules/shared/components/busca-lista-input";
import { cn } from "@/lib/utils";
import type { TopVendas } from "@/modules/agencias-crm/view-models/use-agencias-carteira.view-model";

interface AgenciasToolbarProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  topVendas: TopVendas;
  onTopVendasChange: (valor: TopVendas) => void;
  atualizadoEm: string;
}

// Barra de controle superior da listagem (SPEC_AGENCIAS_SAKURA seções 2.2
// e 2.3) — "Financial Adapter — Atualizado em..." é texto informativo
// estático (não existe fonte de "última sincronização" real pra essa
// listagem hoje). Painel de filtros avançados removido nessa reestilização
// (pedido do usuário, 2026-08-21) — a SPEC nova só prevê busca + toggle.
export function AgenciasToolbar({
  busca,
  onBuscaChange,
  topVendas,
  onTopVendasChange,
  atualizadoEm,
}: AgenciasToolbarProps) {
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
                "rounded-full px-4 py-1.5 transition",
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
                "rounded-full px-4 py-1.5 transition",
                topVendas === "vendasMes"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Mês
            </button>
          </div>
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
