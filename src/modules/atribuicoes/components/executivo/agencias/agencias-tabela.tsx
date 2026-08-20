"use client";

import { ExternalLink, Heart } from "lucide-react";
import {
  SortableDataTable,
  type SortableColumn,
} from "@/modules/shared/components/sortable-data-table";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
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

// Rank numérico da faixa de recência — só pra ordenação (ver comentário
// na coluna "Última" abaixo).
const RANK_RECENCIA: Record<AgenciaCarteiraView["faixaRecencia"], number> = {
  ate30d: 1,
  "30a90d": 2,
  "90a365d": 3,
  semVenda365d: 4,
};

const LABEL_RECENCIA: Record<AgenciaCarteiraView["faixaRecencia"], string> = {
  ate30d: "≤ 30d",
  "30a90d": "30–90d",
  "90a365d": "90d–1a",
  semVenda365d: "sem venda (1a+)",
};

// SortableDataTable configurada pra carteira de agências do executivo
// (SPEC 6.2). Sem coluna BASE (ver adapter) e sem clique-pra-abrir-modal:
// o "Modal Detalhe da Agência" (SPEC seção 7) é de outro módulo e ficou
// fora do escopo desta fase.
export function AgenciasTabela({ agencias, periodo }: AgenciasTabelaProps) {
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
      render: (a) => <span className="text-foreground font-medium">{a.nome}</span>,
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
      // Faixa aproximada (não dias exatos) — o SST não expõe data exata
      // da última venda por agência num formato barato de buscar, ver
      // AgenciaCarteiraResumo em executivo-detalhe.types.ts.
      key: "faixaRecencia",
      label: "Última",
      align: "right",
      sortable: true,
      sortValue: (a) => RANK_RECENCIA[a.faixaRecencia],
      render: (a) => (
        <span className="text-muted-foreground">{LABEL_RECENCIA[a.faixaRecencia]}</span>
      ),
    },
    {
      key: "limite",
      label: "Limite (mock)",
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
