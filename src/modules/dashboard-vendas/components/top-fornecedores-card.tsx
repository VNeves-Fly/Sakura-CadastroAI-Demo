"use client";

import { useState } from "react";
import { Plane } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { RankedList } from "@/modules/dashboard-vendas/components/ui/ranked-list";
import { TopFornecedoresDetalheModal } from "@/modules/dashboard-vendas/components/top-fornecedores-detalhe-modal";
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

export function LogoFornecedor({ nome }: { nome: string }) {
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
      style={{ backgroundColor: COR_ROSA_BG, color: COR_ROSA }}
    >
      {nome.slice(0, 2)}
    </span>
  );
}

interface TopFornecedoresCardProps {
  fornecedoresPorMes: Record<string, TopFornecedor[]>;
}

// 4.10 — Top 10 Fornecedores visível no card; clicar abre o ranking
// completo (scroll infinito, 20 em 20, mesma ordem) no modal.
export function TopFornecedoresCard({ fornecedoresPorMes }: TopFornecedoresCardProps) {
  const [periodo, setPeriodo] = useState<"mes" | "ano">("mes");
  const [modalAberto, setModalAberto] = useState(false);
  const rankingCompleto = fornecedoresPorMes[periodo] ?? [];
  const top10 = rankingCompleto.slice(0, 10);

  return (
    <>
      <RankedList
        icon={Plane}
        titulo="Top 10 Fornecedores (mês)"
        subtitulo="% = participação no volume do mês"
        aoClicar={() => setModalAberto(true)}
        acoes={<PeriodToggle opcoes={OPCOES_PERIODO} valor={periodo} onChange={setPeriodo} />}
        itens={top10.map((fornecedor) => ({
          icone: <LogoFornecedor nome={fornecedor.nome} />,
          nome: fornecedor.nome,
          subtitulo: `${formatarNumero(fornecedor.qtdBilhetes)} bilhetes · AÉREO`,
          valorPrincipal: formatarMoedaAbreviada(fornecedor.valor),
          valorSecundario: formatarPercentual(fornecedor.participacaoPct),
        }))}
      />

      <TopFornecedoresDetalheModal
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        titulo={`Top Fornecedores (${periodo === "mes" ? "mês" : "ano"})`}
        itens={rankingCompleto}
      />
    </>
  );
}
