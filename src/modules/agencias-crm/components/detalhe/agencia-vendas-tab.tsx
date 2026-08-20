"use client";

import { cn } from "@/lib/utils";
import { AgenciaVendasVisaoGeral } from "@/modules/agencias-crm/components/detalhe/agencia-vendas-visao-geral";
import { AgenciaVendasReservas } from "@/modules/agencias-crm/components/detalhe/agencia-vendas-reservas";
import { AgenciaVendasFaturas } from "@/modules/agencias-crm/components/detalhe/agencia-vendas-faturas";
import type { SubAbaVendas } from "@/modules/agencias-crm/view-models/use-agencia-detalhe.view-model";
import type { AgenciaDetalheVendas } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaVendasTabProps {
  vendas: AgenciaDetalheVendas;
  identificadorAgencia: string;
  subAba: SubAbaVendas;
  onMudarSubAba: (subAba: SubAbaVendas) => void;
}

// Aba "Vendas" (SPEC seção 4.4) — dono das 3 sub-abas internas. Badge de
// contagem só aparece quando há itens (mesmo padrão de badge das
// AgenciasStatusTabs).
export function AgenciaVendasTab({
  vendas,
  identificadorAgencia,
  subAba,
  onMudarSubAba,
}: AgenciaVendasTabProps) {
  const subAbas: { chave: SubAbaVendas; label: string; contagem: number | null }[] = [
    { chave: "visao_geral", label: "Visão Geral", contagem: null },
    { chave: "reservas", label: "Reservas", contagem: vendas.reservas.length },
    { chave: "faturas", label: "Faturas", contagem: vendas.faturas.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border flex gap-1 border-b">
        {subAbas.map((aba) => {
          const ativa = aba.chave === subAba;
          return (
            <button
              key={aba.chave}
              type="button"
              onClick={() => onMudarSubAba(aba.chave)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition",
                ativa
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {aba.label}
              {aba.contagem ? (
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                  {aba.contagem}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {subAba === "visao_geral" ? <AgenciaVendasVisaoGeral vendas={vendas} /> : null}
      {subAba === "reservas" ? (
        <AgenciaVendasReservas
          reservas={vendas.reservas}
          identificadorAgencia={identificadorAgencia}
        />
      ) : null}
      {subAba === "faturas" ? (
        <AgenciaVendasFaturas
          faturas={vendas.faturas}
          identificadorAgencia={identificadorAgencia}
        />
      ) : null}
    </div>
  );
}
