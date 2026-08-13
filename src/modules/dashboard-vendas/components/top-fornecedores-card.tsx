"use client";

import { useState } from "react";
import { Plane } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { RankedList } from "@/modules/dashboard-vendas/components/ui/ranked-list";
import {
  formatarMoedaAbreviada,
  formatarNumero,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_ROSA,
  COR_ROSA_BG,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { TopFornecedor } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const OPCOES_PERIODO: { valor: "mes" | "ano"; label: string }[] = [
  { valor: "mes", label: "Mês" },
  { valor: "ano", label: "Ano" },
];

interface TopFornecedoresCardProps {
  fornecedoresPorMes: Record<string, TopFornecedor[]>;
}

// 4.10 — Top 10 Fornecedores/companhias aéreas do período.
export function TopFornecedoresCard({ fornecedoresPorMes }: TopFornecedoresCardProps) {
  const [periodo, setPeriodo] = useState<"mes" | "ano">("mes");
  const fornecedores = fornecedoresPorMes[periodo] ?? [];

  return (
    <RankedList
      icon={Plane}
      titulo="Top 10 Fornecedores (mês)"
      subtitulo="% = participação no volume do mês"
      acoes={<PeriodToggle opcoes={OPCOES_PERIODO} valor={periodo} onChange={setPeriodo} />}
      itens={fornecedores.map((fornecedor) => ({
        icone: (
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ backgroundColor: COR_ROSA_BG, color: COR_ROSA }}
          >
            {fornecedor.nome.slice(0, 2)}
          </span>
        ),
        nome: fornecedor.nome,
        subtitulo: `${formatarNumero(fornecedor.qtdBilhetes)} bilhetes · AÉREO`,
        valorPrincipal: formatarMoedaAbreviada(fornecedor.valor),
        valorSecundario: formatarPercentual(fornecedor.participacaoPct),
      }))}
    />
  );
}
