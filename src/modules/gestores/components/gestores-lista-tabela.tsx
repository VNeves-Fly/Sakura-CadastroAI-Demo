"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  SortableDataTable,
  type SortableColumn,
} from "@/modules/shared/components/sortable-data-table";
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
}

export function GestoresListaTabela({ gestores, isLoading, error }: GestoresListaTabelaProps) {
  const router = useRouter();

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
  ];

  return (
    <SortableDataTable
      columns={colunas}
      rows={gestores}
      rowKey={(linha) => linha.id}
      defaultSort={{ key: "total", direction: "desc" }}
      onRowClick={(linha) => router.push(`/crm/gestores/${linha.id}`)}
      emptyMessage="Nenhum gestor encontrado."
    />
  );
}
