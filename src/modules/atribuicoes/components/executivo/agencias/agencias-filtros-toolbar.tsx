"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
  AgenciasCarteiraFiltros,
  PeriodoVendas,
} from "@/modules/atribuicoes/types/executivo-agencias.types";

interface AgenciasFiltrosToolbarProps {
  filtros: AgenciasCarteiraFiltros;
  onAtualizarFiltro: <K extends keyof AgenciasCarteiraFiltros>(
    chave: K,
    valor: AgenciasCarteiraFiltros[K],
  ) => void;
  total: number;
}

const PERIODOS: { chave: PeriodoVendas; label: string }[] = [
  { chave: "mes", label: "Mês" },
  { chave: "30d", label: "30d" },
  { chave: "90d", label: "90d" },
  { chave: "ano", label: "Ano" },
];

// MultiFilterToolbar (SPEC seção 6.1) — 3 selects na primeira linha,
// busca + contador + período em pills na segunda. "Dados Faltantes" e
// "Inativadas Sakura" foram removidos em 2026-08-20 (eram sobre o funil de
// cadastro/onboarding deste app, que não existe mais nesta aba — a lista
// agora vem do roster do SST, ver executivo-agencias.adapter.ts);
// "Premiação" removido em 2026-08-21 (pedido do usuário) — a coluna
// "Categoria" continua na tabela, só não filtra mais por ela.
export function AgenciasFiltrosToolbar({
  filtros,
  onAtualizarFiltro,
  total,
}: AgenciasFiltrosToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Campo label="Canal de Vendas">
          <SelectField
            value={filtros.canalVendas}
            onValueChange={(v) =>
              onAtualizarFiltro("canalVendas", (v as typeof filtros.canalVendas) ?? "todos")
            }
            options={[
              { value: "todos", label: "Todos os canais" },
              { value: "aereo", label: "Só aéreo" },
              { value: "terrestre", label: "Só terrestre" },
              { value: "ambos", label: "Ambos os canais" },
            ]}
          />
        </Campo>
        <Campo label="Última Compra">
          <SelectField
            value={filtros.ultimaCompra}
            onValueChange={(v) =>
              onAtualizarFiltro("ultimaCompra", (v as typeof filtros.ultimaCompra) ?? "qualquer")
            }
            options={[
              { value: "qualquer", label: "Qualquer data" },
              { value: "ate30", label: "Até 30 dias" },
              { value: "30a90", label: "30 a 90 dias" },
              { value: "mais90", label: "+90 dias" },
            ]}
          />
        </Campo>
        <Campo label="Ordenar por">
          <SelectField
            value={filtros.ordenarPor}
            onValueChange={(v) =>
              onAtualizarFiltro("ordenarPor", (v as typeof filtros.ordenarPor) ?? "vendasAno")
            }
            options={[
              { value: "vendasAno", label: "Vendas Ano (maior primeiro)" },
              { value: "vendasPeriodo", label: "Vendas Período" },
              { value: "ticketMedio", label: "Ticket Médio" },
              { value: "ultimaCompra", label: "Última Compra" },
            ]}
          />
        </Campo>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-[230px]">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={filtros.busca}
              onChange={(event) => onAtualizarFiltro("busca", event.target.value)}
              placeholder="Buscar agência..."
              className="rounded-full pl-8"
            />
          </div>
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            <span className="text-foreground font-semibold">{total}</span> agência(s)
          </span>
          <label className="text-muted-foreground flex items-center gap-2 text-sm whitespace-nowrap">
            <Switch
              checked={filtros.apenasComprando}
              onCheckedChange={(valor) => onAtualizarFiltro("apenasComprando", valor)}
            />
            Apenas agências que estão comprando
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">Período:</span>
          <div className="bg-muted inline-flex rounded-full p-1 text-sm">
            {PERIODOS.map((periodo) => (
              <button
                key={periodo.chave}
                type="button"
                onClick={() => onAtualizarFiltro("periodo", periodo.chave)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  filtros.periodo === periodo.chave
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {periodo.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
