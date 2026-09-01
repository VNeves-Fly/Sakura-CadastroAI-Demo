"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion, LayoutGroup } from "motion/react";
import { Inbox, Bot, FileEdit, CheckCircle2, type LucideIcon } from "lucide-react";
import { DashboardKpiCard, type Periodo } from "@/modules/admin/components/dashboard-kpi-card";
import { useMediaQuery } from "@/hooks/use-media-query";

// Cores reaproveitadas do painel de /cadastros (mesma linguagem visual por
// status): rosa = entrada, roxo = IA, teal = etapa do analista, verde =
// ativo.
const COR_ENTRADA = "#F60F9E";
const COR_IA = "#8A2BE2";
const COR_COMPLEMENTAR = "#008B8B";
const COR_ATIVO = "#008000";

// Altura total do bloco quando um card está expandido — cada uma das 3
// linhas do grid (o card grande spanando as 3, os 3 compactos ocupando 1
// cada) precisa de uma altura definida no container pra "1fr" distribuir
// de verdade (sem isso o grid fica com altura intrínseca/auto, e as linhas
// não fecham numa altura previsível). ~2x a altura natural de um card
// colapsado (pedido do usuário: "terá o dobro da altura que estão").
const ALTURA_EXPANDIDA_PX = 420;

interface SeriePeriodoItem {
  periodo: string;
  quantidade: number;
}

interface SeriesMovimentacao {
  dia: SeriePeriodoItem[];
  mes: SeriePeriodoItem[];
  ano: SeriePeriodoItem[];
}

interface DashboardKpisGridProps {
  // Só pro tooltip informativo do card "Análise de Documentos" — o valor
  // grande dele agora é a soma do período, igual aos outros 3.
  emComplementarPorInfoPendente: { emAberto: number; infoPendente: number };
  seriesNovosCadastros: SeriesMovimentacao;
  seriesContratosIa: SeriesMovimentacao;
  seriesEmComplementar: SeriesMovimentacao;
  seriesAtivas: SeriesMovimentacao;
}

interface KpiDef {
  icon: LucideIcon;
  titulo: string;
  descricaoBase: string;
  cor: string;
  series: SeriesMovimentacao;
  tooltip?: ReactNode;
}

// Grid achatado 3 colunas x 3 linhas quando algo está expandido — os 4
// cards ficam SEMPRE irmãos diretos do mesmo container (nunca reparentam),
// só a posição de cada um muda via style inline; o motion.div layout
// (dentro de DashboardKpiCard) faz o FLIP entre as duas posições sozinho,
// independente de como o CSS chegou no novo retângulo. Reparentar um
// wrapper novo em volta dos 3 não-expandidos quebraria a continuidade da
// animação: React desmonta/remonta um nó que troca de pai, mesmo com a
// mesma key.
function calcularPosicao(
  indice: number,
  expandedIndex: number | null,
  indices: number[],
): CSSProperties | undefined {
  if (expandedIndex === null) return undefined;
  if (indice === expandedIndex) {
    return { gridColumn: "1 / span 2", gridRow: "1 / span 3" };
  }
  const posicaoNaPilha = indices.filter((i) => i !== expandedIndex).indexOf(indice);
  return { gridColumn: "3 / span 1", gridRow: `${posicaoNaPilha + 1} / span 1` };
}

// Client Component só pra isolar os ícones do lucide-react (funções, não
// serializáveis) dentro da fronteira client — DashboardKpiCard também é
// "use client", então passar `icon={Inbox}` direto de dashboard/page.tsx
// (Server Component, busca dado real) pra ele quebra em produção
// ("Functions cannot be passed directly to Client Components"). Recebendo
// só números/objetos simples como props (serializáveis) e resolvendo os
// ícones aqui dentro, a fronteira nunca precisa serializar uma função.
export function DashboardKpisGrid({
  emComplementarPorInfoPendente,
  seriesNovosCadastros,
  seriesContratosIa,
  seriesEmComplementar,
  seriesAtivas,
}: DashboardKpisGridProps) {
  const { emAberto, infoPendente } = emComplementarPorInfoPendente;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  // O layout 2/3 + 1/3 só cabe a partir do breakpoint xl (1280px) do
  // Tailwind — abaixo disso o grid sempre cai no responsivo padrão.
  const isXl = useMediaQuery("(min-width: 1280px)");
  const expandedIndexEfetivo = isXl ? expandedIndex : null;

  function aoClicarExpandir(indice: number) {
    setExpandedIndex((atual) => (atual === indice ? null : indice));
    // Reseta o período ao expandir/colapsar — evita cards colapsados
    // mostrando janelas de tempo diferentes entre si, sem nenhuma pista
    // visual de qual está ativa (pills só existem quando expandido).
    setPeriodo("dia");
  }

  const kpis: KpiDef[] = [
    {
      icon: Inbox,
      titulo: "Novos cadastros",
      descricaoBase: "novos cadastros",
      cor: COR_ENTRADA,
      series: seriesNovosCadastros,
    },
    {
      icon: Bot,
      titulo: "Contratos IA",
      descricaoBase: "contratos gerados pela IA",
      cor: COR_IA,
      series: seriesContratosIa,
    },
    {
      icon: FileEdit,
      titulo: "Análise de Documentos",
      descricaoBase: "cadastros em Análise de Documentos",
      cor: COR_COMPLEMENTAR,
      series: seriesEmComplementar,
      tooltip: (
        <div className="space-y-1">
          <p>
            <strong>{emAberto}</strong> em aberto — aguardando análise do time
          </p>
          <p>
            <strong>{infoPendente}</strong> com informação pendente — aguardando retorno da agência
            (reenvio de documento solicitado)
          </p>
        </div>
      ),
    },
    {
      icon: CheckCircle2,
      titulo: "Ativas",
      descricaoBase: "agências ativadas",
      cor: COR_ATIVO,
      series: seriesAtivas,
    },
  ];

  const indices = kpis.map((_, indice) => indice);

  return (
    <LayoutGroup>
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        style={
          expandedIndexEfetivo !== null
            ? {
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gridTemplateRows: "repeat(3, minmax(0, 1fr))",
                height: ALTURA_EXPANDIDA_PX,
              }
            : undefined
        }
      >
        {kpis.map((kpi, indice) => (
          <DashboardKpiCard
            key={kpi.titulo}
            icon={kpi.icon}
            titulo={kpi.titulo}
            descricaoBase={kpi.descricaoBase}
            cor={kpi.cor}
            series={kpi.series}
            tooltip={kpi.tooltip}
            expandido={expandedIndexEfetivo === indice}
            compacto={expandedIndexEfetivo !== null && expandedIndexEfetivo !== indice}
            podeExpandir={isXl}
            periodo={periodo}
            onToggleExpandir={() => aoClicarExpandir(indice)}
            onMudarPeriodo={setPeriodo}
            style={calcularPosicao(indice, expandedIndexEfetivo, indices)}
          />
        ))}
      </motion.div>
    </LayoutGroup>
  );
}
