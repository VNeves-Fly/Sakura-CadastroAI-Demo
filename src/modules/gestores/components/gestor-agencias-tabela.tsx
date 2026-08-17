"use client";

import Link from "next/link";
import { ExternalLink, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  SortableDataTable,
  type SortableColumn,
} from "@/modules/shared/components/sortable-data-table";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { valorNoPeriodo } from "@/modules/gestores/adapters/gestor-agencias-tab.adapter";
import { formatarMoedaAbreviada } from "@/modules/gestores/utils/formatar-moeda.util";
import type {
  AgenciaDaGestaoView,
  PeriodoVendas,
} from "@/modules/gestores/types/gestor-agencias-tab.types";

interface GestorAgenciasTabelaProps {
  agencias: AgenciaDaGestaoView[];
  periodo: PeriodoVendas;
}

// SortableDataTable da carteira de agências do gestor (SPEC seção 8) —
// mesmo componente do dashboard de Executivo (agencias-tabela.tsx), com
// colunas Executivo (link pro detalhe) e Base a mais, porque a carteira
// aqui soma vários executivos.
export function GestorAgenciasTabela({ agencias, periodo }: GestorAgenciasTabelaProps) {
  const colunas: SortableColumn<AgenciaDaGestaoView>[] = [
    {
      key: "posicao",
      label: "#",
      render: (_agencia, indice) => <span className="text-muted-foreground">{indice + 1}</span>,
      headerClassName: "w-10",
    },
    {
      key: "nome",
      label: "Agência",
      sortable: true,
      sortValue: (a) => a.nome,
      render: (a) => <span className="text-foreground font-medium">{a.nome}</span>,
    },
    {
      key: "executivoNome",
      label: "Executivo",
      sortable: true,
      sortValue: (a) => a.executivoNome,
      render: (a) => (
        <Link
          href={`/crm/executivos/${a.executivoId}`}
          className="text-primary hover:underline"
          onClick={(evento) => evento.stopPropagation()}
        >
          {a.executivoNome}
        </Link>
      ),
    },
    {
      key: "base",
      label: "Base",
      render: (a) =>
        a.base ? (
          <Badge variant="outline" className="text-muted-foreground">
            {a.base}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "categoria",
      label: "Categoria",
      align: "center",
      sortable: true,
      sortValue: (a) => a.categoria,
      render: (a) => (
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
          <Heart className="size-3" /> {a.categoria}
        </span>
      ),
    },
    {
      key: "vendasPeriodo",
      label: "Vendas Período",
      align: "right",
      sortable: true,
      sortValue: (a) => valorNoPeriodo(a, periodo).vendas,
      render: (a) => (
        <SensitiveValue value={formatarMoedaAbreviada(valorNoPeriodo(a, periodo).vendas)} />
      ),
    },
    {
      key: "bilhetes",
      label: "Bilhetes",
      align: "right",
      sortable: true,
      sortValue: (a) => valorNoPeriodo(a, periodo).bilhetes,
      render: (a) => <SensitiveValue value={valorNoPeriodo(a, periodo).bilhetes} />,
    },
    {
      key: "ticketMedio",
      label: "Ticket Médio",
      align: "right",
      sortable: true,
      sortValue: (a) => valorNoPeriodo(a, periodo).ticketMedio,
      render: (a) => (
        <SensitiveValue value={formatarMoedaAbreviada(valorNoPeriodo(a, periodo).ticketMedio)} />
      ),
    },
    {
      key: "vendasAno",
      label: "Vendas Ano",
      align: "right",
      sortable: true,
      sortValue: (a) => a.vendasAno,
      render: (a) => (
        <span className="text-primary font-semibold">
          <SensitiveValue value={formatarMoedaAbreviada(a.vendasAno)} />
        </span>
      ),
    },
    {
      key: "diasSemComprar",
      label: "Última",
      align: "right",
      sortable: true,
      sortValue: (a) => a.diasSemComprar,
      render: (a) => <span className="text-muted-foreground">{a.diasSemComprar}d</span>,
    },
    {
      key: "limite",
      label: "Limite",
      align: "right",
      sortable: true,
      sortValue: (a) => a.limite,
      render: (a) => (
        <span className="inline-flex items-center justify-end gap-1.5">
          <SensitiveValue value={formatarMoedaAbreviada(a.limite)} />
          <ExternalLink className="text-muted-foreground size-3.5" />
        </span>
      ),
    },
  ];

  return (
    <SortableDataTable
      columns={colunas}
      rows={agencias}
      rowKey={(a) => a.id}
      emptyMessage="Nenhuma agência encontrada com esses filtros."
    />
  );
}
