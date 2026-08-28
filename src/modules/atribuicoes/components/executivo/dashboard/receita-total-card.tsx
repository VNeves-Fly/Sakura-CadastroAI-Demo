"use client";

import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Bus, Clock, Plane } from "lucide-react";
import { FiltroPeriodoExecutivoPopover } from "@/modules/atribuicoes/components/executivo/dashboard/filtro-periodo-executivo-popover";
import { CanalResumoCard } from "@/modules/atribuicoes/components/executivo/dashboard/canal-resumo-card";
import { MargemRentabBloco } from "@/modules/atribuicoes/components/executivo/dashboard/margem-rentab-bloco";
import {
  useFiltroPeriodoExecutivoStore,
  resolverPeriodoExecutivo,
} from "@/modules/atribuicoes/stores/filtro-periodo-executivo.store";
import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { gerarAtualizadoEm } from "@/modules/atribuicoes/utils/canal-resumo-mock.util";
import {
  formatarMoedaCompleta,
  formatarPercentual,
} from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type {
  MargemRentabExecutivo,
  PeriodoVendasMesHero,
  VendasMesHero,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface ReceitaTotalCardProps {
  hero: Record<PeriodoVendasMesHero, VendasMesHero>;
  margemRentab: MargemRentabExecutivo;
  perfilId: string;
}

// Card "Receita total" (SPEC 3.5+3.6) — número principal do dashboard do
// Executivo (`hero`, real via SST quando há SICA — ver
// executivo-dashboard.controller.ts/obterHeroKpis), com o filtro de
// período próprio (ver filtro-periodo-executivo.store.ts) e os dois
// cartões de canal (Aéreo/Terrestre) logo abaixo. Margem/rentab. por
// canal são reais desde 2026-08-24 (ver executivo-dashboard.sst-service.ts,
// margemRentab) — só o timestamp "Atualizado em" continua mock
// (`perfilId` serve de seed determinístico só pra isso, sem fonte real de
// "hora de sincronização" no SST).
export function ReceitaTotalCard({ hero, margemRentab, perfilId }: ReceitaTotalCardProps) {
  const filtro = useFiltroPeriodoExecutivoStore((estado) => estado.filtro);
  const periodo = resolverPeriodoExecutivo(filtro);
  const dadosDoPeriodo = hero[periodo];
  const margemDoPeriodo = margemRentab[periodo];
  const negativo = dadosDoPeriodo.variacaoPct < 0;

  const atualizadoEm = useMemo(() => gerarAtualizadoEm(hashParaNumero(perfilId)), [perfilId]);

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* items-center (não items-baseline): o valor grande e o bloco de
              margem/rentab. de 2 linhas precisam ficar centralizados um em
              relação ao outro como grupo. Gradiente/tamanho do valor
              padronizados com o "valor total" do Dashboard CRM (ver
              resumo-do-dia-card.tsx) e do Gestor — pedido do usuário,
              2026-08-21, pra manter os 3 dashboards visualmente iguais. */}
          <div className="flex flex-wrap items-center gap-4">
            <p
              className="bg-clip-text text-4xl font-black break-words text-transparent sm:text-[42px]"
              style={{ backgroundImage: "linear-gradient(90deg, #EC0C8C, #8B5CF6, #3B82F6)" }}
            >
              {formatarMoedaCompleta(dadosDoPeriodo.valor)}
            </p>
            <MargemRentabBloco
              margemLabel="MARGEM TOTAL"
              margemPct={margemDoPeriodo.total.margemPct}
              margemLYPct={margemDoPeriodo.total.margemLYPct}
              margemVariacaoPct={margemDoPeriodo.total.margemVariacaoPct}
              rentabLYValor={margemDoPeriodo.total.rentabLYValor}
              rentabLYVariacaoPct={margemDoPeriodo.total.rentabLYVariacaoPct}
              tamanho="grande"
            />
          </div>

          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[12.5px]">
            <Clock className="size-3.25" />
            Atualizado em {atualizadoEm}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <FiltroPeriodoExecutivoPopover />
          <span
            className={
              negativo
                ? "text-destructive inline-flex items-center gap-1 text-sm font-semibold"
                : "text-success inline-flex items-center gap-1 text-sm font-semibold"
            }
          >
            {negativo ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
            {formatarPercentual(Math.abs(dadosDoPeriodo.variacaoPct))}
          </span>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <CanalResumoCard
          canal={margemDoPeriodo.aereo}
          titulo="Aéreo"
          unidade="bilhetes"
          icon={Plane}
          tema="rosa"
        />
        <CanalResumoCard
          canal={margemDoPeriodo.terrestre}
          titulo="Terrestre"
          unidade="vendas"
          icon={Bus}
          tema="azul"
        />
      </div>
    </div>
  );
}
