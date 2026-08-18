"use client";

import { useMemo, useState } from "react";
import { Bus, Plane, Trophy, Users } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { RankedList } from "@/modules/dashboard-vendas/components/ui/ranked-list";
import { PersonalizadoDateRange } from "@/modules/dashboard-vendas/components/ui/personalizado-date-range";
import { PersonalizadoAviso } from "@/modules/dashboard-vendas/components/ui/personalizado-aviso";
import { TopAgenciasDetalheModal } from "@/modules/dashboard-vendas/components/top-agencias-detalhe-modal";
import {
  formatarMoedaAbreviada,
  formatarNumero,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  dividirPorTipoRota,
  OPCOES_TIPO_ROTA,
  valorNoTipoRota,
  type TipoRota,
} from "@/modules/dashboard-vendas/utils/tipo-rota.util";
import {
  COR_AZUL,
  COR_ROSA,
  COR_ROXO,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { Canal, TopAgencia } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

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

export const ICONE_CANAL: Record<Canal, typeof Plane> = {
  aereo: Plane,
  terrestre: Bus,
  ambos: Users,
};
export const COR_CANAL: Record<Canal, string> = {
  aereo: COR_ROSA,
  terrestre: COR_AZUL,
  ambos: COR_ROSA,
};

interface TopAgenciasCardProps {
  rankingPorMes: Record<string, TopAgencia[]>;
}

// 4.10 — Top 10 Agências visível no card; clicar abre o ranking completo
// (scroll infinito, 20 em 20, mesma ordem) no modal. Filtro
// Nacional/Internacional/Todos (pedido do usuário, 2026-08-17) reordena
// pelo valor mockado de cada escopo — ver tipo-rota.util.ts.
export function TopAgenciasCard({ rankingPorMes }: TopAgenciasCardProps) {
  const [periodo, setPeriodo] = useState<FiltroPeriodo>("mes");
  const [tipoRota, setTipoRota] = useState<TipoRota>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const personalizado = periodo === "personalizado";
  const periodoComDados = personalizado ? PERIODO_PREVIA_PERSONALIZADO : periodo;
  const rankingCompleto = useMemo(
    () => rankingPorMes[periodoComDados] ?? [],
    [rankingPorMes, periodoComDados],
  );

  const rankingFiltrado = useMemo(() => {
    const comSplit = rankingCompleto.map((agencia) => ({
      ...agencia,
      valorExibido: valorNoTipoRota(
        agencia.valor,
        dividirPorTipoRota(agencia.nome, agencia.valor),
        tipoRota,
      ),
      qtdExibida: valorNoTipoRota(
        agencia.qtd,
        dividirPorTipoRota(`${agencia.nome}-qtd`, agencia.qtd),
        tipoRota,
      ),
    }));

    if (tipoRota === "todos") return comSplit;
    return [...comSplit]
      .sort((a, b) => b.valorExibido - a.valorExibido)
      .map((agencia, indice) => ({ ...agencia, posicao: indice + 1 }));
  }, [rankingCompleto, tipoRota]);

  const top10 = rankingFiltrado.slice(0, 10);

  return (
    <>
      <RankedList
        icon={Trophy}
        titulo="Top 10 Agências (mês)"
        subtitulo="Modalidade: Aéreo + Terrestre"
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
        itens={top10.map((agencia) => {
          const Icone = ICONE_CANAL[agencia.canal];
          return {
            posicao: agencia.posicao,
            icone: (
              <Icone className="size-3.5 shrink-0" style={{ color: COR_CANAL[agencia.canal] }} />
            ),
            nome: agencia.nome,
            valorPrincipal: formatarMoedaAbreviada(agencia.valorExibido),
            valorSecundario: formatarNumero(agencia.qtdExibida),
          };
        })}
      />

      <TopAgenciasDetalheModal
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        titulo={`Top Agências (${periodoComDados === "mes" ? "mês" : "ano"})`}
        itens={rankingCompleto}
      />
    </>
  );
}
