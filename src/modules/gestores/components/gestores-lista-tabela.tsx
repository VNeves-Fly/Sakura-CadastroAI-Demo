"use client";

import type { ReactNode } from "react";
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

// "-" enquanto os indicadores não foram carregados (botão "Visualizar
// dados" ainda não clicado) — SPEC pedida pelo usuário, 2026-08-17.
function Indicador({ valor }: { valor: ReactNode }) {
  if (valor === null || valor === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }
  return <>{valor}</>;
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
      sortValue: (linha) => linha.total ?? -1,
      render: (linha) => (
        <Indicador
          valor={
            linha.total !== null ? (
              <SensitiveValue className="font-medium" value={linha.total} />
            ) : null
          }
        />
      ),
    },
    {
      key: "vendendo30d",
      label: "Vend. 30d",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.vendendo30d ?? -1,
      render: (linha) => (
        <Indicador
          valor={
            linha.vendendo30d !== null ? (
              <SensitiveValue
                className={
                  linha.vendendo30d > 0 ? "text-success font-medium" : "text-muted-foreground"
                }
                value={linha.vendendo30d}
              />
            ) : null
          }
        />
      ),
    },
    {
      key: "paradas90d",
      label: "Paradas +90d",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.paradas90d ?? -1,
      render: (linha) => {
        if (linha.paradas90d === null) return <Indicador valor={null} />;
        return linha.paradas90d > 0 ? (
          <SensitiveValue
            value={
              <Badge variant="destructive" className="tabular-nums">
                {linha.paradas90d}
              </Badge>
            }
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "vendasMes",
      label: "Vendas mês",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.vendasMes ?? -1,
      render: (linha) => (
        <Indicador
          valor={
            linha.vendasMes !== null ? (
              <SensitiveValue value={formatarMoedaAbreviada(linha.vendasMes)} />
            ) : null
          }
        />
      ),
    },
    {
      key: "vendasAno",
      label: "Vendas ano",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.vendasAno ?? -1,
      render: (linha) => (
        <Indicador
          valor={
            linha.vendasAno !== null ? (
              <SensitiveValue
                className="text-primary font-semibold"
                value={formatarMoedaAbreviada(linha.vendasAno)}
              />
            ) : null
          }
        />
      ),
    },
    {
      key: "limite",
      label: "Limite",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.limite ?? -1,
      render: (linha) => (
        <Indicador
          valor={
            linha.limite !== null ? (
              <SensitiveValue value={formatarMoedaAbreviada(linha.limite)} />
            ) : null
          }
        />
      ),
    },
    {
      key: "saudePercentual",
      label: "Saúde",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.saudePercentual ?? -1,
      render: (linha) => {
        if (linha.saudePercentual === null) return <Indicador valor={null} />;
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
