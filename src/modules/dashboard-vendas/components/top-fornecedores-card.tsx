"use client";

import { useMemo, useState } from "react";
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
  dividirPorTipoRota,
  OPCOES_TIPO_ROTA,
  valorNoTipoRota,
  type TipoRota,
} from "@/modules/dashboard-vendas/utils/tipo-rota.util";
import {
  COR_ROSA,
  COR_ROSA_BG,
  COR_ROXO,
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
// completo (scroll infinito, 20 em 20, mesma ordem) no modal. Filtro
// Nacional/Internacional/Todos (pedido do usuário, 2026-08-17) reordena
// pelo valor mockado de cada escopo — ver tipo-rota.util.ts.
export function TopFornecedoresCard({ fornecedoresPorMes }: TopFornecedoresCardProps) {
  const [periodo, setPeriodo] = useState<"mes" | "ano">("mes");
  const [tipoRota, setTipoRota] = useState<TipoRota>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const rankingCompleto = useMemo(
    () => fornecedoresPorMes[periodo] ?? [],
    [fornecedoresPorMes, periodo],
  );

  const rankingFiltrado = useMemo(() => {
    const comSplit = rankingCompleto.map((fornecedor) => ({
      ...fornecedor,
      valorExibido: valorNoTipoRota(
        fornecedor.valor,
        dividirPorTipoRota(fornecedor.nome, fornecedor.valor),
        tipoRota,
      ),
      qtdExibida: valorNoTipoRota(
        fornecedor.qtdBilhetes,
        dividirPorTipoRota(`${fornecedor.nome}-qtd`, fornecedor.qtdBilhetes),
        tipoRota,
      ),
    }));

    if (tipoRota === "todos") return comSplit;
    return [...comSplit].sort((a, b) => b.valorExibido - a.valorExibido);
  }, [rankingCompleto, tipoRota]);

  const top10 = rankingFiltrado.slice(0, 10);

  return (
    <>
      <RankedList
        icon={Plane}
        titulo="Top 10 Fornecedores (mês)"
        subtitulo="% = participação no volume do mês"
        aoClicar={() => setModalAberto(true)}
        acoes={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <PeriodToggle
              opcoes={OPCOES_TIPO_ROTA}
              valor={tipoRota}
              onChange={setTipoRota}
              cor={COR_ROXO}
            />
            <PeriodToggle opcoes={OPCOES_PERIODO} valor={periodo} onChange={setPeriodo} />
          </div>
        }
        itens={top10.map((fornecedor) => ({
          icone: <LogoFornecedor nome={fornecedor.nome} />,
          nome: fornecedor.nome,
          subtitulo: `${formatarNumero(fornecedor.qtdExibida)} bilhetes · AÉREO`,
          valorPrincipal: formatarMoedaAbreviada(fornecedor.valorExibido),
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
