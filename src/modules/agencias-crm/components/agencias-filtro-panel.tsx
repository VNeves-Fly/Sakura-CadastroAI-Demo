"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { SelectField } from "@/components/ui/select-field";
import type {
  AgenciasCarteiraFiltros,
  OpcaoFiltro,
} from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasFiltroPanelProps {
  filtros: AgenciasCarteiraFiltros;
  onAtualizarFiltro: <K extends keyof AgenciasCarteiraFiltros>(
    chave: K,
    valor: AgenciasCarteiraFiltros[K],
  ) => void;
  onLimpar: () => void;
  opcoesExecutivo: OpcaoFiltro[];
  opcoesGestor: OpcaoFiltro[];
  opcoesBase: OpcaoFiltro[];
  opcoesRegiao: OpcaoFiltro[];
}

// Grid de filtros expansível (SPEC seção 3.3, 5 colunas × 2 linhas + linha
// de "Inativadas Sakura"/"Limpar filtros"). "Situação Receita" fica
// presente na UI mas não filtra nada hoje — ver comentário no tipo
// AgenciasCarteiraFiltros.
export function AgenciasFiltroPanel({
  filtros,
  onAtualizarFiltro,
  onLimpar,
  opcoesExecutivo,
  opcoesGestor,
  opcoesBase,
  opcoesRegiao,
}: AgenciasFiltroPanelProps) {
  return (
    <div className="border-border bg-muted/20 flex flex-col gap-3 rounded-2xl border p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Campo label="Região">
          <SelectField
            value={filtros.regiao}
            onValueChange={(v) => onAtualizarFiltro("regiao", v ?? "todas")}
            options={[{ value: "todas", label: "Todas as regiões" }, ...opcoesRegiao]}
          />
        </Campo>
        <Campo label="Base">
          <SelectField
            value={filtros.base}
            onValueChange={(v) => onAtualizarFiltro("base", v ?? "todas")}
            options={[{ value: "todas", label: "Todas as bases" }, ...opcoesBase]}
          />
        </Campo>
        <Campo label="Executivo">
          <SelectField
            value={filtros.executivoId}
            onValueChange={(v) => onAtualizarFiltro("executivoId", v ?? "todos")}
            options={[{ value: "todos", label: "Todos os executivos" }, ...opcoesExecutivo]}
            searchable
          />
        </Campo>
        <Campo label="Gestor">
          <SelectField
            value={filtros.gestorNome}
            onValueChange={(v) => onAtualizarFiltro("gestorNome", v ?? "todos")}
            options={[{ value: "todos", label: "Todos os gestores" }, ...opcoesGestor]}
          />
        </Campo>
        <Campo label="Situação Receita">
          <SelectField
            value={filtros.situacaoReceita}
            onValueChange={(v) => onAtualizarFiltro("situacaoReceita", v ?? "todas")}
            options={[
              { value: "todas", label: "Todas as situações" },
              { value: "ativa", label: "Ativa" },
              { value: "nao_consultado", label: "Não consultado" },
            ]}
          />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
              { value: "vendasAno", label: "Vendas Ano (maior → menor)" },
              { value: "vendasMes", label: "Vendas Mês (maior → menor)" },
              { value: "razaoSocial", label: "Razão Social (A-Z)" },
              { value: "createdAt", label: "Cadastro (mais recente)" },
              { value: "ultimaCompra", label: "Dias sem comprar (maior → menor)" },
            ]}
          />
        </Campo>
      </div>

      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <Campo label="Inativadas Sakura" inline>
          <SelectField
            value={filtros.ocultarInativadas ? "ocultar" : "mostrar"}
            onValueChange={(v) => onAtualizarFiltro("ocultarInativadas", v !== "mostrar")}
            options={[
              { value: "ocultar", label: "Ocultar inativadas" },
              { value: "mostrar", label: "Mostrar todas" },
            ]}
          />
        </Campo>
        <button
          type="button"
          onClick={onLimpar}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
        >
          <X className="size-3.5" />
          Limpar filtros
        </button>
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
  inline,
}: {
  label: string;
  children: ReactNode;
  inline?: boolean;
}) {
  return (
    <label className={inline ? "flex items-center gap-2" : "flex flex-col gap-1"}>
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
