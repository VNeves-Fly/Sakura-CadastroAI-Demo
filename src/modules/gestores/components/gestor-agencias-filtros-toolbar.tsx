"use client";

import type { ReactNode } from "react";
import { SelectField } from "@/components/ui/select-field";
import { BuscaListaInput } from "@/modules/shared/components/busca-lista-input";
import { cn } from "@/lib/utils";
import type {
  AgenciasDaGestaoFiltros,
  PeriodoVendas,
} from "@/modules/gestores/types/gestor-agencias-tab.types";

interface OpcaoExecutivo {
  id: string;
  nome: string;
}

interface GestorAgenciasFiltrosToolbarProps {
  filtros: AgenciasDaGestaoFiltros;
  onAtualizarFiltro: <K extends keyof AgenciasDaGestaoFiltros>(
    chave: K,
    valor: AgenciasDaGestaoFiltros[K],
  ) => void;
  total: number;
  opcoesExecutivo: OpcaoExecutivo[];
}

const PERIODOS: { chave: PeriodoVendas; label: string }[] = [
  { chave: "mes", label: "Mês" },
  { chave: "30d", label: "30d" },
  { chave: "90d", label: "90d" },
  { chave: "ano", label: "Ano" },
];

// Toolbar de filtros da aba Agências do gestor — mesmo padrão de
// agencias-filtros-toolbar.tsx (Executivo), com um select a mais
// ("Executivo") porque a carteira do gestor soma vários executivos.
export function GestorAgenciasFiltrosToolbar({
  filtros,
  onAtualizarFiltro,
  total,
  opcoesExecutivo,
}: GestorAgenciasFiltrosToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <Campo label="Executivo">
          <SelectField
            value={filtros.executivoId}
            onValueChange={(v) => onAtualizarFiltro("executivoId", v ?? "todos")}
            options={[
              { value: "todos", label: "Todos executivos" },
              ...opcoesExecutivo.map((executivo) => ({
                value: executivo.id,
                label: executivo.nome,
              })),
            ]}
          />
        </Campo>
        <Campo label="Dados Faltantes">
          <SelectField
            value={filtros.dadosFaltantes}
            onValueChange={(v) =>
              onAtualizarFiltro("dadosFaltantes", (v as typeof filtros.dadosFaltantes) ?? "todos")
            }
            options={[
              { value: "todos", label: "Todos" },
              { value: "pendentes", label: "Pendentes" },
            ]}
          />
        </Campo>
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
        <Campo label="Premiação">
          <SelectField
            value={filtros.premiacao}
            onValueChange={(v) =>
              onAtualizarFiltro("premiacao", (v as typeof filtros.premiacao) ?? "todas")
            }
            options={[
              { value: "todas", label: "Todas as faixas" },
              { value: "10K", label: "10K" },
              { value: "100K", label: "100K" },
              { value: "1M", label: "1M" },
              { value: "10M", label: "10M" },
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
        <Campo label="Inativadas Sakura">
          <SelectField
            value={filtros.inativadasSakura}
            onValueChange={(v) =>
              onAtualizarFiltro(
                "inativadasSakura",
                (v as typeof filtros.inativadasSakura) ?? "ocultar",
              )
            }
            options={[
              { value: "ocultar", label: "Ocultar inativadas" },
              { value: "mostrar", label: "Mostrar todas" },
            ]}
          />
        </Campo>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BuscaListaInput
            value={filtros.busca}
            onChange={(valor) => onAtualizarFiltro("busca", valor)}
            placeholder="Buscar agência..."
          />
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            <span className="text-foreground font-semibold">{total}</span> agência(s)
          </span>
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

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
