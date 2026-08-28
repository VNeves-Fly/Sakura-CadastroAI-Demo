"use client";

import { useMemo, useState } from "react";
import { Bus, Plane, Trophy, Users } from "lucide-react";
import { RankedList } from "@/modules/dashboard-vendas/components/ui/ranked-list";
import { FiltroTipoRotaPopover } from "@/modules/dashboard-vendas/components/ui/filtro-tipo-rota-popover";
import { CarregandoOverlay } from "@/modules/dashboard-vendas/components/ui/carregando-overlay";
import { TopAgenciasDetalheModal } from "@/modules/dashboard-vendas/components/top-agencias-detalhe-modal";
import {
  formatarMoedaAbreviada,
  formatarNumero,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  dividirPorTipoRota,
  valorNoTipoRota,
  type TipoRota,
} from "@/modules/dashboard-vendas/utils/tipo-rota.util";
import {
  COR_AZUL,
  COR_ROSA,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import {
  useFiltroPeriodoDashboardStore,
  resolverPeriodo,
  LABEL_PERIODO_TITULO,
} from "@/modules/dashboard-vendas/stores/filtro-periodo-dashboard.store";
import type {
  Canal,
  PeriodoResumo,
  TopAgencia,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

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
  rankingPorPeriodo: Record<PeriodoResumo, TopAgencia[]>;
}

// 4.10 — Top 10 Agências visível no card; clicar abre o ranking completo
// (scroll infinito, 20 em 20, mesma ordem) no modal. Período (Hoje/Ontem/
// Mês/Ano/Personalizado) vem da store global do cabeçalho — não é mais
// filtro próprio deste card (pedido do usuário, 2026-08-20; antes só
// entendia Mês/Ano, isolado dos outros cards). Filtro Nacional/
// Internacional/Todos (pedido do usuário, 2026-08-17) continua local a
// este card, atrás do botão "Filtrar" — reordena pelo valor mockado de
// cada escopo, ver tipo-rota.util.ts.
export function TopAgenciasCard({ rankingPorPeriodo }: TopAgenciasCardProps) {
  const filtro = useFiltroPeriodoDashboardStore((estado) => estado.filtro);
  const { dados: personalizadoDados, carregando: personalizadoCarregando } =
    useFiltroPeriodoDashboardStore((estado) => estado.personalizado);
  const [tipoRota, setTipoRota] = useState<TipoRota>("todos");
  const [modalAberto, setModalAberto] = useState(false);

  const usandoPersonalizado = filtro === "personalizado" && personalizadoDados !== null;
  const periodoComDados = resolverPeriodo(filtro);
  const tituloPeriodo = usandoPersonalizado
    ? "Personalizado"
    : LABEL_PERIODO_TITULO[periodoComDados];
  const rankingCompleto = useMemo(
    () =>
      usandoPersonalizado ? personalizadoDados.ranking : (rankingPorPeriodo[periodoComDados] ?? []),
    [usandoPersonalizado, personalizadoDados, rankingPorPeriodo, periodoComDados],
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
      <div className="relative">
        <CarregandoOverlay ativo={filtro === "personalizado" && personalizadoCarregando} />
        <RankedList
          icon={Trophy}
          titulo={`Top 10 Agências (${tituloPeriodo})`}
          subtitulo="Modalidade: Aéreo + Terrestre"
          aoClicar={() => setModalAberto(true)}
          acoes={<FiltroTipoRotaPopover valor={tipoRota} onChange={setTipoRota} />}
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
      </div>

      <TopAgenciasDetalheModal
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        titulo={`Top Agências (${tituloPeriodo})`}
        itens={rankingCompleto}
      />
    </>
  );
}
