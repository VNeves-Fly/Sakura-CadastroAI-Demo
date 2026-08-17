"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { BuscaListaInput } from "@/modules/shared/components/busca-lista-input";
import {
  SortableDataTable,
  type SortableColumn,
} from "@/modules/shared/components/sortable-data-table";
import {
  formatarMoedaAbreviada,
  formatarPercentual,
} from "@/modules/gestores/utils/formatar-moeda.util";
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
      render: (linha) => (
        <span className="text-muted-foreground font-mono text-xs">{linha.sica ?? "—"}</span>
      ),
    },
    {
      key: "nome",
      label: "Executivo",
      sortable: true,
      sortValue: (linha) => linha.nome,
      render: (linha) => (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-medium",
              linha.semVendaAno ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {linha.nome}
          </span>
          <span className="text-muted-foreground text-xs">{linha.email}</span>
        </div>
      ),
    },
    {
      key: "bases",
      label: "Bases",
      render: (linha) => (
        <span className="text-muted-foreground max-w-40 truncate" title={linha.bases.join(", ")}>
          {linha.bases.length > 0 ? linha.bases.join(", ") : "—"}
        </span>
      ),
    },
    {
      key: "aprovadas",
      label: "Aprov.",
      align: "right",
      sortable: true,
      sortValue: (linha) => linha.aprovadas,
      render: (linha) => <SensitiveValue value={linha.aprovadas} />,
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
        linha.semVendaAno ? (
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
      key: "ativo",
      label: "Status",
      align: "center",
      render: (linha) => (
        <Badge
          variant="outline"
          className={
            linha.ativo
              ? "border-success/30 bg-success/10 text-success"
              : "border-muted-foreground/30 bg-muted text-muted-foreground"
          }
        >
          {linha.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "chevron",
      label: "",
      align: "right",
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
      />
    </div>
  );
}
