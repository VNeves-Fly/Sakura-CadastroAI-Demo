"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCarregamentoInfinito } from "@/modules/dashboard-vendas/hooks/use-carregamento-infinito";
import {
  formatarMoedaBrl,
  formatarNumero,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import { exportarCsv } from "@/modules/dashboard-vendas/utils/csv-export.util";
import type { AgenciaCruzamentoDetalhe } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const COLUNAS = [
  "Agência",
  "Base",
  "Executivo",
  "Bilhetes Aéreo",
  "Aéreo 365d",
  "Vendas Terrestre",
  "Terrestre 365d",
  "Última Aéreo",
  "Última Terrestre",
];

interface CruzamentoDetalheModalProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  totalReal: number;
  pct: number;
  itens: AgenciaCruzamentoDetalhe[];
}

// Detalhamento dos 4 cards de cruzamento (4.11) — mesmo estilo de modal
// dos demais, busca por nome/CNPJ, tabela de 9 colunas, scroll infinito
// de 20 em 20 e export CSV do que já foi carregado.
export function CruzamentoDetalheModal({
  aberto,
  onOpenChange,
  titulo,
  totalReal,
  pct,
  itens,
}: CruzamentoDetalheModalProps) {
  const [busca, setBusca] = useState("");

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter(
      (item) => item.nome.toLowerCase().includes(termo) || item.cnpj.includes(termo),
    );
  }, [itens, busca]);

  const { itensVisiveis, scrollRef, sentinelaRef, temMais } =
    useCarregamentoInfinito(itensFiltrados);

  function baixarCsv() {
    exportarCsv(
      `${titulo.toLowerCase().replace(/\s+/g, "-")}.csv`,
      COLUNAS,
      itensFiltrados.map((item) => [
        item.nome,
        item.base,
        item.executivo,
        item.bilhetesAereo,
        formatarMoedaBrl(item.aereo365d),
        item.vendasTerrestre,
        formatarMoedaBrl(item.terrestre365d),
        item.ultimaAereo ?? "—",
        item.ultimaTerrestre ?? "—",
      ]),
    );
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        onOpenChange(valor);
        if (!valor) setBusca("");
      }}
    >
      <DialogContent className="dashboard-vendas-scope max-w-5xl">
        <DialogHeader className="flex-row items-baseline gap-2 space-y-0">
          <DialogTitle>{titulo}</DialogTitle>
          <span className="text-muted-foreground text-sm">
            {formatarNumero(totalReal)} agência(s) · {formatarPercentual(pct, 0)} da carteira
          </span>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 p-4 pb-3">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar nome ou CNPJ..."
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border py-2.5 pr-4 pl-10 text-sm outline-none focus:ring-2"
            />
          </div>
          <button
            type="button"
            onClick={baixarCsv}
            className="border-input text-foreground hover:bg-accent flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition"
          >
            <Download className="size-3.5" />
            CSV
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                {COLUNAS.map((coluna) => (
                  <th
                    key={coluna}
                    className={`text-muted-foreground px-2 py-2.5 text-xs font-semibold tracking-wide uppercase ${
                      coluna.includes("365d") ||
                      coluna === "Bilhetes Aéreo" ||
                      coluna === "Vendas Terrestre"
                        ? "text-right"
                        : ""
                    }`}
                  >
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itensVisiveis.map((item) => (
                <tr key={item.cnpj} className="border-border border-b last:border-0">
                  <td className="px-2 py-2.5">
                    <p className="text-foreground font-semibold">{item.nome}</p>
                    <p className="text-muted-foreground text-xs">{item.cnpj}</p>
                  </td>
                  <td className="text-muted-foreground px-2 py-2.5 whitespace-nowrap">
                    {item.base}
                  </td>
                  <td className="text-muted-foreground px-2 py-2.5 whitespace-nowrap">
                    {item.executivo}
                  </td>
                  <td className="text-foreground px-2 py-2.5 text-right">
                    {item.bilhetesAereo || "—"}
                  </td>
                  <td className="text-foreground px-2 py-2.5 text-right font-semibold whitespace-nowrap">
                    {item.aereo365d ? formatarMoedaBrl(item.aereo365d) : "—"}
                  </td>
                  <td className="text-foreground px-2 py-2.5 text-right">
                    {item.vendasTerrestre || "—"}
                  </td>
                  <td className="text-foreground px-2 py-2.5 text-right font-semibold whitespace-nowrap">
                    {item.terrestre365d ? formatarMoedaBrl(item.terrestre365d) : "—"}
                  </td>
                  <td className="text-muted-foreground px-2 py-2.5 whitespace-nowrap">
                    {item.ultimaAereo ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-2 py-2.5 whitespace-nowrap">
                    {item.ultimaTerrestre ?? "—"}
                  </td>
                </tr>
              ))}
              {itensVisiveis.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUNAS.length}
                    className="text-muted-foreground py-12 text-center text-sm"
                  >
                    Nenhuma agência encontrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          {temMais ? (
            <div ref={sentinelaRef} className="text-muted-foreground py-4 text-center text-xs">
              Carregando mais agências...
            </div>
          ) : itensVisiveis.length > 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs">
              {itens.length < totalReal
                ? `Mostrando ${formatarNumero(itens.length)} de ${formatarNumero(totalReal)} — refine a busca pra encontrar uma agência específica.`
                : "Fim da lista."}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
