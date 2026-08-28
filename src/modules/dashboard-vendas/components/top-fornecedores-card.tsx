"use client";

import { useMemo, useState } from "react";
import { Plane } from "lucide-react";
import { RankedList } from "@/modules/dashboard-vendas/components/ui/ranked-list";
import { FiltroTipoRotaPopover } from "@/modules/dashboard-vendas/components/ui/filtro-tipo-rota-popover";
import { TopFornecedoresDetalheModal } from "@/modules/dashboard-vendas/components/top-fornecedores-detalhe-modal";
import {
  formatarMoedaAbreviada,
  formatarNumero,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  dividirPorTipoRota,
  valorNoTipoRota,
  type TipoRota,
} from "@/modules/dashboard-vendas/utils/tipo-rota.util";
import {
  COR_ROSA,
  COR_ROSA_BG,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import {
  useFiltroPeriodoDashboardStore,
  resolverPeriodo,
  LABEL_PERIODO_TITULO,
  LABEL_PERIODO_PREPOSICAO,
} from "@/modules/dashboard-vendas/stores/filtro-periodo-dashboard.store";
import type {
  PeriodoResumo,
  TopFornecedor,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

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
  fornecedoresPorPeriodo: Record<PeriodoResumo, TopFornecedor[]>;
}

// 4.10 — Top 10 Fornecedores visível no card; clicar abre o ranking
// completo (scroll infinito, 20 em 20, mesma ordem) no modal. Período
// (Hoje/Ontem/Mês/Ano/Personalizado) vem da store global do cabeçalho —
// não é mais filtro próprio deste card (pedido do usuário, 2026-08-20;
// antes só entendia Mês/Ano, isolado dos outros cards). Filtro Nacional/
// Internacional/Todos (pedido do usuário, 2026-08-17) continua local a
// este card, atrás do botão "Filtrar" — reordena pelo valor mockado de
// cada escopo, ver tipo-rota.util.ts.
export function TopFornecedoresCard({ fornecedoresPorPeriodo }: TopFornecedoresCardProps) {
  const filtro = useFiltroPeriodoDashboardStore((estado) => estado.filtro);
  const personalizadoDados = useFiltroPeriodoDashboardStore((estado) => estado.personalizado.dados);
  const [tipoRota, setTipoRota] = useState<TipoRota>("todos");
  const [modalAberto, setModalAberto] = useState(false);

  const usandoPersonalizado = filtro === "personalizado" && personalizadoDados !== null;
  const periodoComDados = resolverPeriodo(filtro);
  const tituloPeriodo = usandoPersonalizado
    ? "Personalizado"
    : LABEL_PERIODO_TITULO[periodoComDados];
  const preposicaoPeriodo = usandoPersonalizado
    ? "no período"
    : LABEL_PERIODO_PREPOSICAO[periodoComDados];
  const rankingCompleto = useMemo(
    () =>
      usandoPersonalizado
        ? personalizadoDados.fornecedores
        : (fornecedoresPorPeriodo[periodoComDados] ?? []),
    [usandoPersonalizado, personalizadoDados, fornecedoresPorPeriodo, periodoComDados],
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
        titulo={`Top 10 Fornecedores (${tituloPeriodo})`}
        subtitulo={`% = participação no volume ${preposicaoPeriodo}`}
        aoClicar={() => setModalAberto(true)}
        acoes={<FiltroTipoRotaPopover valor={tipoRota} onChange={setTipoRota} />}
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
        titulo={`Top Fornecedores (${tituloPeriodo})`}
        itens={rankingCompleto}
      />
    </>
  );
}
