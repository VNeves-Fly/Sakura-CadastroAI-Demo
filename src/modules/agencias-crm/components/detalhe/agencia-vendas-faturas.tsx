"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { exportarCsv } from "@/modules/agencias-crm/utils/csv-export.util";
import {
  formatarData,
  formatarMoedaAbreviada,
} from "@/modules/agencias-crm/utils/formatar-moeda.util";
import { cn } from "@/lib/utils";
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

// Cores exatas da pill de status (SPEC_AGENCIAS_SAKURA seção 3.7) —
// largura fixa 84px, pill sempre do mesmo tamanho independente do texto.
const STATUS_CLASSES: Record<FaturaAgencia["status"], string> = {
  pago: "text-[#047857] border-[rgba(16,185,129,.35)]",
  a_vencer: "text-[#B45309] border-[rgba(245,158,11,.4)]",
  vencido: "text-[#DC2626] border-[rgba(239,68,68,.35)]",
};

// Grid de 4 colunas iguais (SPEC 3.7): Número (esquerda) · Vencimento
// (centro) · Valor (centro) · Status (direita).
const COLS = "repeat(4, minmax(0,1fr))";

// Aba "Faturas" do detalhe de Agência (SPEC seção 3.7) — real via SST
// (GET /api/agencias/faturas, ver agencia-detalhe.sst-service.ts) quando
// a agência tem venda detectada; mock por hash como fallback (mesmo
// critério do resto do módulo). Coluna "Cias" da versão antiga foi
// removida (a SPEC nova só prevê Número/Vencimento/Valor/Status);
// `fatura.cias` continua no CSV exportado, só não aparece mais na tabela
// em tela.
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
            placeholder="Buscar fatura..."
            className="border-border bg-background text-foreground h-9 min-w-60 rounded-lg border pr-3 pl-8 text-xs outline-none"
          />
        </div>
        <button
          type="button"
          onClick={exportar}
          disabled={filtradas.length === 0}
          className="border-border text-foreground hover:bg-muted flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-3.5" />
          Exportar CSV
        </button>
      </div>

      <div className="border-border overflow-x-auto rounded-xl border">
        <div className="min-w-[520px]">
          <div
            className="border-border grid border-b bg-[#FAFAFD] px-3 py-2.5 text-[11px] font-bold tracking-wide text-[#8888AA] uppercase"
            style={{ gridTemplateColumns: COLS }}
          >
            <span>Número</span>
            <span className="text-center">Vencimento</span>
            <span className="text-center">Valor</span>
            <span className="text-right">Status</span>
          </div>

          {filtradas.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Nenhuma fatura encontrada.
            </p>
          ) : (
            filtradas.map((fatura) => (
              <div
                key={fatura.numero}
                className="border-border grid items-center border-b px-3 py-3 text-[13px] transition-colors last:border-0 hover:bg-[#FCFAFD]"
                style={{ gridTemplateColumns: COLS }}
              >
                <span className="text-[#2A2A40] tabular-nums">{fatura.numero}</span>
                <span className="text-center tabular-nums">{formatarData(fatura.vencimento)}</span>
                <span
                  className={cn(
                    "text-center font-semibold tabular-nums",
                    fatura.valor < 0 ? "text-[#059669]" : "text-[#1A1A2E]",
                  )}
                >
                  {formatarMoedaAbreviada(fatura.valor)}
                </span>
                <div className="flex justify-end">
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full border py-0.5 text-[11.5px] font-semibold",
                      STATUS_CLASSES[fatura.status],
                    )}
                    style={{ width: 84 }}
                  >
                    {STATUS_LABEL[fatura.status]}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
