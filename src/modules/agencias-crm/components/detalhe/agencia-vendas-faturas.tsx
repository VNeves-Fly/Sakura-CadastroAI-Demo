"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { exportarCsv } from "@/modules/agencias-crm/utils/csv-export.util";
import {
  formatarData,
  formatarMoedaAbreviada,
} from "@/modules/agencias-crm/utils/formatar-moeda.util";
import type { FaturaAgencia } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaVendasFaturasProps {
  faturas: FaturaAgencia[];
  identificadorAgencia: string;
}

const STATUS_LABEL: Record<FaturaAgencia["status"], string> = {
  pago: "Pago",
  a_vencer: "A vencer",
  vencido: "Vencido",
};

const STATUS_VARIANT: Record<FaturaAgencia["status"], "outline" | "destructive"> = {
  pago: "outline",
  a_vencer: "outline",
  vencido: "destructive",
};

const STATUS_CLASSES: Record<FaturaAgencia["status"], string> = {
  pago: "text-emerald-600 dark:text-emerald-400",
  a_vencer: "text-amber-600 dark:text-amber-400",
  vencido: "",
};

// Sub-aba "Faturas" de Vendas (SPEC seção 4.4) — mock determinístico (não
// existe fatura real modelada no domínio hoje, ver
// agencia-detalhe.adapter.ts). Busca/export são reais, só os dados que
// alimentam são mock.
export function AgenciaVendasFaturas({ faturas, identificadorAgencia }: AgenciaVendasFaturasProps) {
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return faturas;
    return faturas.filter(
      (fatura) =>
        fatura.numero.toLowerCase().includes(termo) || fatura.cias.toLowerCase().includes(termo),
    );
  }, [faturas, busca]);

  function exportar() {
    exportarCsv(
      `faturas-${identificadorAgencia}.csv`,
      ["Número", "Vencimento", "Cias", "Status", "Valor"],
      filtradas.map((fatura) => [
        fatura.numero,
        formatarData(fatura.vencimento),
        fatura.cias,
        STATUS_LABEL[fatura.status],
        fatura.valor,
      ]),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar fatura ou cia..."
            className="border-border bg-background text-foreground h-8 w-52 rounded-lg border pr-3 pl-8 text-xs outline-none"
          />
        </div>
        <button
          type="button"
          onClick={exportar}
          disabled={filtradas.length === 0}
          className="border-border text-foreground hover:bg-muted flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-3.5" />
          Exportar CSV
        </button>
      </div>

      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted-foreground bg-muted/40 text-[11px] font-semibold tracking-wide uppercase">
              <th className="px-3 py-2">Número</th>
              <th className="px-3 py-2">Vencimento</th>
              <th className="px-3 py-2">Cias</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-3 py-6 text-center">
                  Nenhuma fatura encontrada.
                </td>
              </tr>
            ) : (
              filtradas.map((fatura) => (
                <tr key={fatura.numero}>
                  <td className="text-foreground px-3 py-2 font-mono text-xs">{fatura.numero}</td>
                  <td className="text-foreground px-3 py-2 whitespace-nowrap">
                    {formatarData(fatura.vencimento)}
                  </td>
                  <td className="text-foreground px-3 py-2">{fatura.cias}</td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={STATUS_VARIANT[fatura.status]}
                      className={STATUS_CLASSES[fatura.status]}
                    >
                      {STATUS_LABEL[fatura.status]}
                    </Badge>
                  </td>
                  <td
                    className={
                      fatura.valor < 0
                        ? "px-3 py-2 text-emerald-600 tabular-nums dark:text-emerald-400"
                        : "text-foreground px-3 py-2 tabular-nums"
                    }
                  >
                    <SensitiveValue value={formatarMoedaAbreviada(fatura.valor)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
