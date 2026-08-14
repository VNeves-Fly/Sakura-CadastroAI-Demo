"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface SortableColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  // Valor usado só pra ordenação — pode divergir do `render` (ex.: ordenar
  // pelo valor numérico "cru" enquanto o render mostra formatado/mascarado).
  sortValue?: (row: T) => number | string;
  // `indice` é a posição da linha na lista já ordenada/filtrada exibida
  // (não no array original) — útil pra colunas de ranking ("#").
  render: (row: T, indice: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface SortableDataTableProps<T> {
  columns: SortableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  defaultSort?: { key: string; direction: SortDirection };
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  emptyMessage?: string;
  // Linha fixa de rodapé (ex.: "Total" somando colunas monetárias, SPEC
  // Agenda · Lista) — mesmas colunas da tabela, sem participar da
  // ordenação.
  footerCells?: (columns: SortableColumn<T>[]) => ReactNode;
}

// Tabela genérica com header ordenável por clique (asc/desc), coluna ativa
// destacada em rosa/negrito — pensada pra ser reaproveitada nas próximas
// fases de Executivos (Agenda · Lista, Agências) além da lista principal.
export function SortableDataTable<T>({
  columns,
  rows,
  rowKey,
  defaultSort,
  onRowClick,
  rowClassName,
  emptyMessage = "Nenhum registro encontrado.",
  footerCells,
}: SortableDataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(
    defaultSort ?? null,
  );

  const linhasOrdenadas = useMemo(() => {
    if (!sort) return rows;
    const coluna = columns.find((item) => item.key === sort.key);
    if (!coluna?.sortValue) return rows;

    const sinal = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const valorA = coluna.sortValue!(a);
      const valorB = coluna.sortValue!(b);
      if (typeof valorA === "number" && typeof valorB === "number") {
        return (valorA - valorB) * sinal;
      }
      return String(valorA).localeCompare(String(valorB)) * sinal;
    });
  }, [rows, sort, columns]);

  function alternarOrdenacao(coluna: SortableColumn<T>) {
    if (!coluna.sortable) return;
    setSort((atual) => {
      if (atual?.key !== coluna.key) return { key: coluna.key, direction: "desc" };
      return { key: coluna.key, direction: atual.direction === "desc" ? "asc" : "desc" };
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((coluna) => {
            const ativa = sort?.key === coluna.key;
            return (
              <TableHead
                key={coluna.key}
                onClick={() => alternarOrdenacao(coluna)}
                className={cn(
                  "text-muted-foreground text-[11px] font-semibold tracking-wide uppercase",
                  coluna.align === "right" && "text-right",
                  coluna.align === "center" && "text-center",
                  coluna.sortable && "cursor-pointer select-none",
                  ativa && "text-primary",
                  coluna.headerClassName,
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    coluna.align === "right" && "justify-end",
                  )}
                >
                  {coluna.label}
                  {coluna.sortable ? (
                    ativa ? (
                      sort?.direction === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    ) : (
                      <ArrowUpDown className="text-muted-foreground/40 size-3" />
                    )
                  ) : null}
                </span>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhasOrdenadas.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={columns.length}
              className="text-muted-foreground py-10 text-center text-sm"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          linhasOrdenadas.map((row, indice) => (
            <TableRow
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(onRowClick && "cursor-pointer", rowClassName?.(row))}
            >
              {columns.map((coluna) => (
                <TableCell
                  key={coluna.key}
                  className={cn(
                    coluna.align === "right" && "text-right",
                    coluna.align === "center" && "text-center",
                    sort?.key === coluna.key && "text-primary font-semibold",
                    coluna.cellClassName,
                  )}
                >
                  {coluna.render(row, indice)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
      {footerCells ? (
        <TableFooter>
          <TableRow className="hover:bg-transparent">{footerCells(columns)}</TableRow>
        </TableFooter>
      ) : null}
    </Table>
  );
}
