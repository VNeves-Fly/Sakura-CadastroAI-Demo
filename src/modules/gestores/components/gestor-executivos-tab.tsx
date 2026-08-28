"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { BuscaListaInput } from "@/modules/shared/components/busca-lista-input";
import {
  SortableDataTable,
  type SortableColumn,
} from "@/modules/shared/components/sortable-data-table";
import { formatarMoedaAbreviada } from "@/modules/gestores/utils/formatar-moeda.util";
import { cn } from "@/lib/utils";
import type { ExecutivoDaGestaoView } from "@/modules/gestores/types/gestor-executivos-tab.types";

interface GestorExecutivosTabProps {
  executivos: ExecutivoDaGestaoView[];
}

// Aba "Executivos" do detalhe do Gestor (SPEC seção 6, specdetalhesgestor.md)
// — mesmo padrão de tabela/toolbar já usado em /crm/executivos, mas restrito
// à carteira deste gestor. Clique na linha leva pro detalhe do executivo
// (mesma página já construída em /crm/executivos/:id), satisfazendo o
// requisito de navegação Gestor -> Executivo (seção 11.1 do SPEC).
export function GestorExecutivosTab({ executivos }: GestorExecutivosTabProps) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [ocultarInativosDoAno, setOcultarInativosDoAno] = useState(false);

  const filtrados = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    return executivos.filter((executivo) => {
      if (ocultarInativosDoAno && executivo.semVendaAno) return false;
      if (buscaNormalizada && !executivo.nome.toLowerCase().includes(buscaNormalizada)) {
        return false;
      }
      return true;
    });
  }, [executivos, busca, ocultarInativosDoAno]);

  const colunas: SortableColumn<ExecutivoDaGestaoView>[] = [
    {
      key: "sica",
      label: "Cód.",
      sortable: true,
      sortValue: (linha) => linha.sica ?? 0,
      headerClassName: "w-[8%]",
      render: (linha) => (
        <span className="text-muted-foreground font-mono text-xs">{linha.sica ?? "—"}</span>
      ),
    },
    {
      key: "nome",
      label: "Executivo",
      sortable: true,
      sortValue: (linha) => linha.nome,
      headerClassName: "w-[42%]",
      render: (linha) => (
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              "truncate font-medium",
              linha.semVendaAno ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {linha.nome}
          </span>
          <span className="text-muted-foreground truncate text-xs">{linha.email}</span>
        </div>
      ),
    },
    {
      key: "vendendo30d",
      label: "Vend. 30d",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.vendendo30d,
      headerClassName: "w-[15%]",
      render: (linha) => (
        <span
          className={linha.vendendo30d > 0 ? "text-success font-medium" : "text-muted-foreground"}
        >
          {linha.vendendo30d}
        </span>
      ),
    },
    {
      key: "vendasMes",
      label: "Vendas mês",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.vendasMes,
      headerClassName: "w-[15%]",
      render: (linha) =>
        linha.semVendaAno ? (
          <Badge variant="outline" className="text-muted-foreground">
            Sem venda
          </Badge>
        ) : (
          formatarMoedaAbreviada(linha.vendasMes)
        ),
    },
    {
      key: "vendasAno",
      label: "Vendas ano",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.vendasAno,
      headerClassName: "w-[15%]",
      render: (linha) => (
        <span className="text-primary font-semibold">
          {formatarMoedaAbreviada(linha.vendasAno)}
        </span>
      ),
    },
    {
      key: "chevron",
      label: "",
      align: "right",
      headerClassName: "w-[5%]",
      render: () => <ChevronRight className="text-muted-foreground ml-auto size-4" />,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="border-border flex flex-wrap items-center gap-4 border-b pb-4">
        <BuscaListaInput value={busca} onChange={setBusca} placeholder="Buscar executivo..." />

        <label className="text-muted-foreground flex items-center gap-2 text-sm whitespace-nowrap">
          <Switch checked={ocultarInativosDoAno} onCheckedChange={setOcultarInativosDoAno} />
          Ocultar inativos do ano
        </label>

        <span className="text-muted-foreground ml-auto text-sm whitespace-nowrap">
          <span className="text-foreground font-semibold">{filtrados.length}</span> de{" "}
          {executivos.length} executivo(s)
        </span>
      </div>

      <SortableDataTable
        columns={colunas}
        rows={filtrados}
        rowKey={(linha) => linha.id}
        defaultSort={{ key: "vendasAno", direction: "desc" }}
        onRowClick={(linha) => router.push(`/crm/executivos/${linha.id}`)}
        rowClassName={(linha) => (linha.semVendaAno ? "opacity-60" : undefined)}
        emptyMessage="Nenhum executivo encontrado."
        tableClassName="table-fixed"
      />
    </div>
  );
}
