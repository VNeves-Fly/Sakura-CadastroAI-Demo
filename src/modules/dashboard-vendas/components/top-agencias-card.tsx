"use client";

import { useState } from "react";
import { Bus, Plane, Trophy, Users } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { RankedList } from "@/modules/dashboard-vendas/components/ui/ranked-list";
import {
  formatarMoedaAbreviada,
  formatarNumero,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_AZUL,
  COR_ROSA,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { Canal, TopAgencia } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const OPCOES_PERIODO: { valor: "mes" | "ano"; label: string }[] = [
  { valor: "mes", label: "Mês" },
  { valor: "ano", label: "Ano" },
];

const ICONE_CANAL: Record<Canal, typeof Plane> = { aereo: Plane, terrestre: Bus, ambos: Users };
const COR_CANAL: Record<Canal, string> = { aereo: COR_ROSA, terrestre: COR_AZUL, ambos: COR_ROSA };

interface TopAgenciasCardProps {
  rankingPorMes: Record<string, TopAgencia[]>;
}

// 4.10 — Top 10 Agências, com ícone do canal predominante por linha.
export function TopAgenciasCard({ rankingPorMes }: TopAgenciasCardProps) {
  const [periodo, setPeriodo] = useState<"mes" | "ano">("mes");
  const agencias = rankingPorMes[periodo] ?? [];

  return (
    <RankedList
      icon={Trophy}
      titulo="Top 10 Agências (mês)"
      subtitulo="Modalidade: Aéreo + Terrestre"
      acoes={<PeriodToggle opcoes={OPCOES_PERIODO} valor={periodo} onChange={setPeriodo} />}
      itens={agencias.map((agencia) => {
        const Icone = ICONE_CANAL[agencia.canal];
        return {
          posicao: agencia.posicao,
          icone: (
            <Icone className="size-3.5 shrink-0" style={{ color: COR_CANAL[agencia.canal] }} />
          ),
          nome: agencia.nome,
          valorPrincipal: formatarMoedaAbreviada(agencia.valor),
          valorSecundario: formatarNumero(agencia.qtd),
        };
      })}
    />
  );
}
