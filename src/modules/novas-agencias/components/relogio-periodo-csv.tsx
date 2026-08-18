"use client";

import { useEffect, useState } from "react";
import { Download, Eye } from "lucide-react";
import { SelectField } from "@/components/ui/select-field";
import { exportarCsv } from "@/modules/novas-agencias/utils/csv-export.util";
import { formatarData, formatarMoeda } from "@/modules/novas-agencias/utils/formatar.util";
import type { AgenciaNova } from "@/modules/novas-agencias/types/novas-agencias.types";

const OPCOES_PERIODO = [
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "12m", label: "Últimos 12 meses" },
];

const COLUNAS_CSV = [
  "Agência",
  "CNPJ",
  "Executivo",
  "Gerente",
  "Entrada",
  "1ª compra",
  "Última compra",
  "Bilhetes",
  "Volume total",
  "Situação",
];

function linhaCsv(agencia: AgenciaNova): (string | number)[] {
  return [
    agencia.nome,
    agencia.cnpj,
    agencia.executivo,
    agencia.gerente,
    formatarData(agencia.entrada),
    formatarData(agencia.primeiraCompra),
    formatarData(agencia.ultimaCompra),
    agencia.bilhetes,
    formatarMoeda(agencia.volumeTotal).replace(/ /g, " "),
    agencia.situacao,
  ];
}

interface RelogioPeriodoCsvProps {
  agencias: AgenciaNova[];
}

// Canto superior direito da página (SPEC seção 3, parte específica
// desta tela — nome/ADMIN/Dev já vêm do header real do admin, não
// duplicados aqui): relógio ao vivo + seletor de período (só de UI, sem
// refetch — os dados mock já representam "últimos 90 dias") + export
// CSV real (Blob + <a download>, 100% client-side).
export function RelogioPeriodoCsv({ agencias }: RelogioPeriodoCsvProps) {
  const [periodo, setPeriodo] = useState("90d");
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
    const id = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-end gap-2 text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5">
        <Eye className="size-3.5" />
        {agora ? (
          new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(agora)
        ) : (
          <span className="text-transparent">—</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <SelectField
          className="w-[170px]"
          options={OPCOES_PERIODO}
          value={periodo}
          onValueChange={(valor) => setPeriodo(valor ?? "90d")}
        />
        <button
          type="button"
          onClick={() =>
            exportarCsv(
              "novas-agencias.csv",
              COLUNAS_CSV,
              agencias.map((agencia) => linhaCsv(agencia)),
            )
          }
          className="border-input text-foreground hover:bg-accent flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition"
        >
          <Download className="size-4" />
          CSV
        </button>
      </div>
    </div>
  );
}
