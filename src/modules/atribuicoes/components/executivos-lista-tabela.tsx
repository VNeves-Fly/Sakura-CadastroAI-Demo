"use client";

import { useRouter } from "next/navigation";
import { Pencil, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  SortableDataTable,
  type SortableColumn,
} from "@/modules/shared/components/sortable-data-table";
import {
  formatarMoedaAbreviada,
  formatarPercentual,
} from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type { PromotorListaView } from "@/modules/atribuicoes/types/promotor-lista.types";
import { cn } from "@/lib/utils";

interface ExecutivosListaTabelaProps {
  executivos: PromotorListaView[];
  isLoading: boolean;
  error: string | null;
  onEditar: (promotorId: string) => void;
  onAlternarAtivo: (promotorId: string, ativo: boolean) => void;
}

export function ExecutivosListaTabela({
  executivos,
  isLoading,
  error,
  onEditar,
  onAlternarAtivo,
}: ExecutivosListaTabelaProps) {
  const router = useRouter();

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando executivos...</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  const colunas: SortableColumn<PromotorListaView>[] = [
    {
      key: "nome",
      label: "Executivo",
      sortable: true,
      sortValue: (linha) => linha.nome,
      render: (linha) => (
        <span className="flex items-center gap-2">
          {/* Cor do nome reflete só o status Inativo — "sem venda" já tem
              seu próprio badge (Vendas mês) e não devia deixar o nome com a
              mesma aparência "apagada" de quem tá inativo. */}
          <span
            className={cn(
              "font-medium uppercase",
              !linha.ativo ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {linha.nome}
          </span>
          {!linha.ativo ? (
            <Badge variant="outline" className="text-muted-foreground text-[10px] normal-case">
              Inativo
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: "gestorNome",
      label: "Gestor",
      sortable: true,
      sortValue: (linha) => linha.gestorNome ?? "",
      render: (linha) => <span className="text-muted-foreground">{linha.gestorNome ?? "—"}</span>,
    },
    {
      key: "aprovadas",
      label: "Aprov.",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.aprovadas,
      render: (linha) => (
        <SensitiveValue
          className={linha.semVenda ? "text-muted-foreground" : "text-success font-medium"}
          value={linha.aprovadas}
        />
      ),
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
      render: (linha) =>
        linha.semVenda ? (
          <Badge variant="outline" className="text-muted-foreground">
            Sem venda
          </Badge>
        ) : (
          <SensitiveValue value={formatarMoedaAbreviada(linha.vendasMes)} />
        ),
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
      render: (linha) => (
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
    <SortableDataTable
      columns={colunas}
      rows={executivos}
      rowKey={(linha) => linha.id}
      defaultSort={{ key: "vendasAno", direction: "desc" }}
      onRowClick={(linha) => router.push(`/crm/executivos/${linha.id}`)}
      // Opacity só por status inativo, não por "sem venda" (semVenda já
      // tem seu próprio indicador — badge na coluna Vendas mês + nome
      // acinzentado — misturar os dois deixava parecer que quem só não
      // vendeu no período estava inativo). Opacity só nas células de
      // dado (":not(:last-child)") — a última é a coluna Ações, que
      // precisa ficar 100% visível pro botão Ativar (verde) não sair
      // apagado junto.
      rowClassName={(linha) => (!linha.ativo ? "[&>td:not(:last-child)]:opacity-60" : undefined)}
      emptyMessage="Nenhum executivo encontrado."
    />
  );
}
