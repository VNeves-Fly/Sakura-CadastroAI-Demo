"use client";

import { useState } from "react";
import { ExternalLink, Heart } from "lucide-react";
import {
  SortableDataTable,
  type SortableColumn,
} from "@/modules/shared/components/sortable-data-table";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { AgenciaDetalheModal } from "@/modules/agencias-crm/components/detalhe/agencia-detalhe-modal";
import { valorNoPeriodo } from "@/modules/atribuicoes/adapters/executivo-agencias.adapter";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type {
  AgenciaCarteiraView,
  PeriodoVendas,
} from "@/modules/atribuicoes/types/executivo-agencias.types";

interface AgenciasTabelaProps {
  agencias: AgenciaCarteiraView[];
  periodo: PeriodoVendas;
}

// SortableDataTable configurada pra carteira de agências do executivo
// (SPEC 6.2). Sem coluna BASE (ver adapter). Nome da agência abre o
// mesmo modal de detalhe usado em /crm/agencias (SPEC seção 7) — antes
// era só texto estático, sem link nenhum (pedido do usuário, 2026-08-20).
export function AgenciasTabela({ agencias, periodo }: AgenciasTabelaProps) {
  const [agenciaSelecionadaId, setAgenciaSelecionadaId] = useState<string | null>(null);

  const colunas: SortableColumn<AgenciaCarteiraView>[] = [
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
      render: (a) => (
        <button
          type="button"
          onClick={() => setAgenciaSelecionadaId(a.id)}
          className="text-primary text-left font-medium hover:underline"
        >
          {a.nome}
        </button>
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
    <>
      <SortableDataTable
        columns={colunas}
        rows={agencias}
        rowKey={(a) => a.id}
        emptyMessage="Nenhuma agência encontrada com esses filtros."
      />
      <AgenciaDetalheModal
        agenciaId={agenciaSelecionadaId}
        onOpenChange={(open) => {
          if (!open) setAgenciaSelecionadaId(null);
        }}
      />
    </>
  );
}
