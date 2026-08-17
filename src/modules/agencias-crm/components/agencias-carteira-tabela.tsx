"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { formatarMoedaAbreviada } from "@/modules/agencias-crm/utils/formatar-moeda.util";
import { cn } from "@/lib/utils";
import type {
  AgenciaCarteiraView,
  AgenciasCarteiraFiltros,
  StatusTab,
} from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasCarteiraTabelaProps {
  agencias: AgenciaCarteiraView[];
  statusTab: StatusTab;
  ordenarPor: AgenciasCarteiraFiltros["ordenarPor"];
  ordenarDirecao: AgenciasCarteiraFiltros["ordenarDirecao"];
  onOrdenar: (coluna: AgenciasCarteiraFiltros["ordenarPor"]) => void;
  onAbrirDetalhe: (agenciaId: string) => void;
  offsetPagina: number;
}

const COLUNAS: {
  chave: AgenciasCarteiraFiltros["ordenarPor"] | null;
  label: string;
  align?: "right" | "center";
}[] = [
  { chave: null, label: "#" },
  { chave: "razaoSocial", label: "Agência" },
  { chave: null, label: "Executivo" },
  { chave: null, label: "Base" },
  { chave: null, label: "Categoria", align: "center" },
  { chave: "bilhetes", label: "Bilhetes", align: "right" },
  { chave: null, label: "Ticket Médio", align: "right" },
  { chave: "vendasMes", label: "Vendas Mês", align: "right" },
  { chave: "vendasAno", label: "Vendas Ano", align: "right" },
  { chave: "ultimaCompra", label: "Última", align: "right" },
  { chave: "limite", label: "Limite", align: "right" },
];

function dataUltimaCompra(diasSemComprar: number): { texto: string; recente: boolean } {
  const data = new Date();
  data.setDate(data.getDate() - diasSemComprar);
  return {
    texto: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(data),
    recente: diasSemComprar <= 30,
  };
}

// Tabela principal da listagem de Agências (SPEC seção 3.5) — cabeçalhos
// clicáveis pra ordenação (estado vem de fora, ver
// use-agencias-carteira.view-model.ts, pra sobreviver à paginação
// client-side). Coluna "Motivo" só aparece na aba Reprovadas + Inativas.
export function AgenciasCarteiraTabela({
  agencias,
  statusTab,
  ordenarPor,
  ordenarDirecao,
  onOrdenar,
  onAbrirDetalhe,
  offsetPagina,
}: AgenciasCarteiraTabelaProps) {
  const mostrarMotivo = statusTab === "reprovadas_inativas";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-border bg-muted/40 border-b">
          <tr>
            {COLUNAS.map((coluna) => {
              const ativa = coluna.chave !== null && coluna.chave === ordenarPor;
              return (
                <th
                  key={coluna.label}
                  onClick={() => coluna.chave && onOrdenar(coluna.chave)}
                  className={cn(
                    "text-muted-foreground px-3 py-2.5 text-xs font-semibold tracking-wide uppercase",
                    coluna.align === "right" && "text-right",
                    coluna.align === "center" && "text-center",
                    coluna.chave && "cursor-pointer select-none",
                    ativa && "text-primary",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      coluna.align === "right" && "justify-end",
                      coluna.align === "center" && "justify-center",
                    )}
                  >
                    {coluna.label}
                    {coluna.chave ? (
                      ativa ? (
                        ordenarDirecao === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ArrowUpDown className="text-muted-foreground/40 size-3" />
                      )
                    ) : null}
                  </span>
                </th>
              );
            })}
            {mostrarMotivo ? (
              <th className="text-muted-foreground px-3 py-2.5 text-xs font-semibold tracking-wide uppercase">
                Motivo
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {agencias.length === 0 ? (
            <tr>
              <td
                colSpan={COLUNAS.length + (mostrarMotivo ? 1 : 0)}
                className="text-muted-foreground py-12 text-center text-sm"
              >
                Nenhuma agência encontrada com esses filtros.
              </td>
            </tr>
          ) : (
            agencias.map((agencia, indice) => {
              const ultima = dataUltimaCompra(agencia.diasSemComprar);
              return (
                <tr
                  key={agencia.id}
                  onClick={() => onAbrirDetalhe(agencia.id)}
                  className="border-border hover:bg-muted/30 cursor-pointer border-b last:border-0"
                >
                  <td className="text-muted-foreground px-3 py-2.5">{offsetPagina + indice + 1}</td>
                  <td className="px-3 py-2.5">
                    <p className="text-foreground max-w-64 truncate font-medium">
                      {agencia.razaoSocial}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    {agencia.executivoNome ? (
                      <span className="text-muted-foreground">{agencia.executivoNome}</span>
                    ) : (
                      <span className="text-warning">não definido</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {agencia.base ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        {agencia.base}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {agencia.categoria ? (
                      <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        🏆 {agencia.categoria}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Sem venda
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <SensitiveValue value={agencia.bilhetes} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <SensitiveValue
                      value={
                        agencia.bilhetes > 0 ? formatarMoedaAbreviada(agencia.ticketMedio) : "—"
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <SensitiveValue
                      value={
                        agencia.vendasMes > 0 ? formatarMoedaAbreviada(agencia.vendasMes) : "—"
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold">
                    <SensitiveValue
                      className="text-primary"
                      value={
                        agencia.vendasAno > 0 ? formatarMoedaAbreviada(agencia.vendasAno) : "—"
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={ultima.recente ? "text-success" : "text-destructive"}>
                      {agencia.bilhetes > 0 ? ultima.texto : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <SensitiveValue value={formatarMoedaAbreviada(agencia.limite)} />
                  </td>
                  {mostrarMotivo ? (
                    <td className="text-muted-foreground px-3 py-2.5">{agencia.motivo ?? "—"}</td>
                  ) : null}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
