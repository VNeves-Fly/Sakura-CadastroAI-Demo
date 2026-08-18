"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { cn } from "@/lib/utils";
import { exportarCsv } from "@/modules/agencias-crm/utils/csv-export.util";
import {
  formatarData,
  formatarMoedaAbreviada,
} from "@/modules/agencias-crm/utils/formatar-moeda.util";
import type { ReservaAgencia } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaVendasReservasProps {
  reservas: ReservaAgencia[];
  identificadorAgencia: string;
}

type FiltroTipo = "todos" | "aereo" | "terrestre";

const PILLS: { chave: FiltroTipo; label: string }[] = [
  { chave: "todos", label: "Todos" },
  { chave: "aereo", label: "Aéreo" },
  { chave: "terrestre", label: "Terrestre" },
];

// Sub-aba "Reservas" de Vendas (SPEC seção 4.4) — mock determinístico
// (não existe reserva/bilhete real modelado no domínio hoje, ver
// agencia-detalhe.adapter.ts). Filtro/busca/export são reais, só os
// dados que alimentam são mock.
export function AgenciaVendasReservas({
  reservas,
  identificadorAgencia,
}: AgenciaVendasReservasProps) {
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return reservas.filter((reserva) => {
      if (filtroTipo !== "todos" && reserva.tipo !== filtroTipo) return false;
      if (!termo) return true;
      return (
        reserva.identificador.toLowerCase().includes(termo) ||
        reserva.descricao.toLowerCase().includes(termo) ||
        (reserva.referencia?.toLowerCase().includes(termo) ?? false)
      );
    });
  }, [reservas, filtroTipo, busca]);

  function exportar() {
    exportarCsv(
      `reservas-${identificadorAgencia}.csv`,
      ["Data", "Tipo", "Identificador", "Descrição", "Referência", "Valor"],
      filtradas.map((reserva) => [
        formatarData(reserva.data),
        reserva.tipo === "aereo" ? "Aéreo" : "Terrestre",
        reserva.identificador,
        reserva.descricao,
        reserva.referencia ?? "",
        reserva.valor,
      ]),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PILLS.map((pill) => (
            <button
              key={pill.chave}
              type="button"
              onClick={() => setFiltroTipo(pill.chave)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition",
                filtroTipo === pill.chave
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground border",
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar reserva..."
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
      </div>

      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted-foreground bg-muted/40 text-[11px] font-semibold tracking-wide uppercase">
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Identificador</th>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2">Referência</th>
              <th className="px-3 py-2">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-3 py-6 text-center">
                  Nenhuma reserva encontrada.
                </td>
              </tr>
            ) : (
              filtradas.map((reserva) => (
                <tr key={reserva.id}>
                  <td className="text-foreground px-3 py-2 whitespace-nowrap">
                    {formatarData(reserva.data)}
                  </td>
                  <td className="text-foreground px-3 py-2">
                    {reserva.tipo === "aereo" ? "Aéreo" : "Terrestre"}
                  </td>
                  <td className="text-foreground px-3 py-2 font-mono text-xs">
                    {reserva.identificador}
                  </td>
                  <td className="text-foreground px-3 py-2">{reserva.descricao}</td>
                  <td className="text-muted-foreground px-3 py-2">{reserva.referencia ?? "—"}</td>
                  <td className="text-foreground px-3 py-2 tabular-nums">
                    <SensitiveValue value={formatarMoedaAbreviada(reserva.valor)} />
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
