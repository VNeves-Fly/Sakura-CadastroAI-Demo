"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  SortableDataTable,
  type SortableColumn,
} from "@/modules/shared/components/sortable-data-table";
import { StickyHorizontalScrollbar } from "@/modules/shared/components/sticky-horizontal-scrollbar";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import { labelDoNivel } from "@/modules/gestores/types/gestor-nivel.types";
import type { GestorListaView } from "@/modules/gestores/types/gestor-lista.types";

interface GestoresListaTabelaProps {
  gestores: GestorListaView[];
  isLoading: boolean;
  error: string | null;
  onEditar: (gestorId: string) => void;
}

export function GestoresListaTabela({
  gestores,
  isLoading,
  error,
  onEditar,
}: GestoresListaTabelaProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando gestores...</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  const colunas: SortableColumn<GestorListaView>[] = [
    {
      key: "nome",
      label: "Gerente",
      sortable: true,
      sortValue: (linha) => linha.nome,
      render: (linha) => (
        <span className="flex items-center gap-2">
          <span className="text-foreground font-medium">{linha.nome}</span>
          {!linha.ativo ? (
            <Badge variant="outline" className="text-muted-foreground text-[10px]">
              Inativo
            </Badge>
          ) : null}
          {linha.semVenda ? (
            <Badge variant="outline" className="text-muted-foreground text-[10px]">
              Sem venda
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: "nivel",
      label: "Nível",
      sortable: true,
      sortValue: (linha) => labelDoNivel(linha.nivel),
      render: (linha) => (
        <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
          {labelDoNivel(linha.nivel)}
        </Badge>
      ),
    },
    {
      key: "executivos",
      label: "Executivos",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.executivos,
      render: (linha) => <span className="text-foreground font-medium">{linha.executivos}</span>,
    },
    {
      key: "vendasMes",
      label: "Vendas mês",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.vendasMes,
      render: (linha) => <SensitiveValue value={formatarMoedaAbreviada(linha.vendasMes)} />,
    },
    {
      key: "vendasAno",
      label: "Vendas ano",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.vendasAno,
      render: (linha) => (
        <SensitiveValue
          className="text-primary font-semibold"
          value={formatarMoedaAbreviada(linha.vendasAno)}
        />
      ),
    },
    {
      key: "acoes",
      label: "",
      align: "right",
      render: (linha) => (
        <div
          className="flex items-center justify-end gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            className="text-primary border-primary/30 hover:bg-primary/5 hover:text-primary"
            onClick={() => onEditar(linha.id)}
          >
            <Pencil className="size-3.5" />
            Editar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <SortableDataTable
        containerRef={containerRef}
        columns={colunas}
        rows={gestores}
        rowKey={(linha) => linha.id}
        defaultSort={{ key: "vendasAno", direction: "desc" }}
        onRowClick={(linha) => router.push(`/crm/gestores/${linha.id}`)}
        // opacity só nas células de dado (":not(:last-child)") — a última é
        // a coluna Ações, que precisa ficar 100% visível.
        rowClassName={(linha) => (!linha.ativo ? "[&>td:not(:last-child)]:opacity-60" : undefined)}
        emptyMessage="Nenhum gestor encontrado."
      />
      <StickyHorizontalScrollbar containerRef={containerRef} />
    </>
  );
}
