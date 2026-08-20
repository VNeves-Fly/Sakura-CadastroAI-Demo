"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  SortableDataTable,
  type SortableColumn,
} from "@/modules/shared/components/sortable-data-table";
import { StickyHorizontalScrollbar } from "@/modules/shared/components/sticky-horizontal-scrollbar";
import {
  formatarMoedaAbreviada,
  formatarPercentual,
} from "@/modules/atribuicoes/utils/formatar-moeda.util";
import { labelDoNivel } from "@/modules/gestores/types/gestor-nivel.types";
import type { GestorListaView } from "@/modules/gestores/types/gestor-lista.types";
import { cn } from "@/lib/utils";

interface GestoresListaTabelaProps {
  gestores: GestorListaView[];
  isLoading: boolean;
  error: string | null;
  onEditar: (gestorId: string) => void;
  onAlternarAtivo: (gestorId: string, ativo: boolean) => void;
}

export function GestoresListaTabela({
  gestores,
  isLoading,
  error,
  onEditar,
  onAlternarAtivo,
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
      key: "total",
      label: "Total",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.total,
      render: (linha) => <SensitiveValue className="font-medium" value={linha.total} />,
    },
    {
      key: "vendendo30d",
      label: "Vend. 30d",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.vendendo30d,
      render: (linha) => (
        <SensitiveValue
          className={linha.vendendo30d > 0 ? "text-success font-medium" : "text-muted-foreground"}
          value={linha.vendendo30d}
        />
      ),
    },
    {
      key: "paradas90d",
      label: "Paradas +90d",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.paradas90d,
      render: (linha) =>
        linha.paradas90d > 0 ? (
          <SensitiveValue
            value={
              <Badge variant="destructive" className="tabular-nums">
                {linha.paradas90d}
              </Badge>
            }
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
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
      key: "limite",
      label: "Limite",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.limite,
      render: (linha) => <SensitiveValue value={formatarMoedaAbreviada(linha.limite)} />,
    },
    {
      key: "saudePercentual",
      label: "Saúde",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.saudePercentual,
      render: (linha) => {
        return (
          <SensitiveValue
            value={
              <div className="flex items-center justify-end gap-2">
                <span className="bg-muted h-1.5 w-14 overflow-hidden rounded-full">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      linha.saudePercentual >= 60
                        ? "bg-success"
                        : linha.saudePercentual >= 30
                          ? "bg-warning"
                          : "bg-destructive",
                    )}
                    style={{ width: `${Math.min(100, linha.saudePercentual)}%` }}
                  />
                </span>
                <span className="text-xs tabular-nums">
                  {formatarPercentual(linha.saudePercentual)}
                </span>
              </div>
            }
          />
        );
      },
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
          <Button
            variant="outline"
            size="sm"
            className={
              linha.ativo
                ? undefined
                : "border-[#16a34a]/50 text-[#16a34a] hover:bg-[#16a34a]/10 hover:text-[#16a34a]"
            }
            onClick={() => onAlternarAtivo(linha.id, !linha.ativo)}
          >
            <Power className="size-3.5" />
            {linha.ativo ? "Inativar" : "Ativar"}
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
        defaultSort={{ key: "total", direction: "desc" }}
        onRowClick={(linha) => router.push(`/crm/gestores/${linha.id}`)}
        // opacity só nas células de dado (":not(:last-child)") — a última é
        // a coluna Ações, que precisa ficar 100% visível pro botão Ativar
        // (verde) não sair apagado junto com o resto da linha.
        rowClassName={(linha) => (!linha.ativo ? "[&>td:not(:last-child)]:opacity-60" : undefined)}
        emptyMessage="Nenhum gestor encontrado."
      />
      <StickyHorizontalScrollbar containerRef={containerRef} />
    </>
  );
}
