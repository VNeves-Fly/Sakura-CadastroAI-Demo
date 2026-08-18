"use client";

import { useMemo, useState } from "react";
import { Plane } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { RankedList } from "@/modules/dashboard-vendas/components/ui/ranked-list";
import { PersonalizadoDateRange } from "@/modules/dashboard-vendas/components/ui/personalizado-date-range";
import { PersonalizadoAviso } from "@/modules/dashboard-vendas/components/ui/personalizado-aviso";
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

// "Personalizado" é só de UI por enquanto — mesmo caso do Resumo do dia
// (ver comentário em resumo-do-dia-card.tsx): sem fonte de dados pra um
// intervalo arbitrário, mostra a prévia do ranking "Mês" com aviso
// (pedido do usuário, 2026-08-18).
type FiltroPeriodo = "mes" | "ano" | "personalizado";
const PERIODO_PREVIA_PERSONALIZADO: "mes" | "ano" = "mes";

const OPCOES_PERIODO: { valor: FiltroPeriodo; label: string }[] = [
  { valor: "mes", label: "Mês" },
  { valor: "ano", label: "Ano" },
  { valor: "personalizado", label: "Personalizado" },
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
  const [periodo, setPeriodo] = useState<FiltroPeriodo>("mes");
  const [tipoRota, setTipoRota] = useState<TipoRota>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const personalizado = periodo === "personalizado";
  const periodoComDados = personalizado ? PERIODO_PREVIA_PERSONALIZADO : periodo;
  const rankingCompleto = useMemo(
    () => fornecedoresPorMes[periodoComDados] ?? [],
    [fornecedoresPorMes, periodoComDados],
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
        acoes={<PeriodToggle opcoes={OPCOES_PERIODO} valor={periodo} onChange={setPeriodo} />}
        extra={
          <div className="flex flex-col items-end gap-2">
            <PeriodToggle
              opcoes={OPCOES_TIPO_ROTA}
              valor={tipoRota}
              onChange={setTipoRota}
              cor={COR_ROXO}
            />
            {personalizado ? (
              <>
                <PersonalizadoDateRange
                  dataInicial={dataInicial}
                  dataFinal={dataFinal}
                  onDataInicialChange={setDataInicial}
                  onDataFinalChange={setDataFinal}
                />
                <PersonalizadoAviso periodoPreviaLabel="Mês" />
              </>
            ) : null}
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
        titulo={`Top Fornecedores (${periodoComDados === "mes" ? "mês" : "ano"})`}
        itens={rankingCompleto}
      />
    </>
  );
}
