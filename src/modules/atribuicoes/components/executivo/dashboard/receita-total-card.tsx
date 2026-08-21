"use client";

import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Bus, Clock, Plane } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { FiltroPeriodoExecutivoPopover } from "@/modules/atribuicoes/components/executivo/dashboard/filtro-periodo-executivo-popover";
import { CanalResumoCard } from "@/modules/atribuicoes/components/executivo/dashboard/canal-resumo-card";
import { MargemRentabBloco } from "@/modules/atribuicoes/components/executivo/dashboard/margem-rentab-bloco";
import {
  useFiltroPeriodoExecutivoStore,
  resolverPeriodoExecutivo,
} from "@/modules/atribuicoes/stores/filtro-periodo-executivo.store";
import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import {
  gerarAtualizadoEm,
  gerarCanalAereo,
  gerarCanalTerrestre,
} from "@/modules/atribuicoes/utils/canal-resumo-mock.util";
import {
  formatarMoedaCompleta,
  formatarPercentual,
} from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type {
  PeriodoVendasMesHero,
  VendasMesHero,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface ReceitaTotalCardProps {
  hero: Record<PeriodoVendasMesHero, VendasMesHero>;
  perfilId: string;
}

// Média ponderada pelo valor de cada canal no período ativo — é assim que
// a margem/rentabilidade "total" bate com a soma dos dois canais (mesma
// conta usada no exemplo aprovado da SPEC: 3,70% = média entre 3,60%
// aéreo e 11,00% terrestre, ponderada pelo peso de cada um no total).
function ponderar(
  valorAereo: number,
  valorTerrestre: number,
  campoAereo: number,
  campoTerrestre: number,
) {
  const total = valorAereo + valorTerrestre;
  if (total === 0) return 0;
  return (valorAereo * campoAereo + valorTerrestre * campoTerrestre) / total;
}

// Card "Receita total" (SPEC 3.5+3.6) — número principal do dashboard do
// Executivo (`hero`, real via SST quando há SICA — ver
// executivo-dashboard.controller.ts/obterHeroKpis), com o filtro de
// período próprio (ver filtro-periodo-executivo.store.ts) e os dois
// cartões de canal (Aéreo/Terrestre) logo abaixo. Margem/rentab. e os
// cartões de canal em si são mock de apresentação (ver
// canal-resumo-mock.util.ts — o SST não expõe margem por canal hoje);
// `perfilId` só serve de seed determinístico pra esse mock, não dispara
// nenhuma chamada nova.
export function ReceitaTotalCard({ hero, perfilId }: ReceitaTotalCardProps) {
  const filtro = useFiltroPeriodoExecutivoStore((estado) => estado.filtro);
  const periodo = resolverPeriodoExecutivo(filtro);
  const dadosDoPeriodo = hero[periodo];
  const negativo = dadosDoPeriodo.variacaoPct < 0;

  const { canalAereo, canalTerrestre, atualizadoEm } = useMemo(() => {
    const base = hashParaNumero(perfilId);
    const aereo = gerarCanalAereo(base);
    return {
      canalAereo: aereo,
      canalTerrestre: gerarCanalTerrestre(base, aereo.participacaoPct),
      atualizadoEm: gerarAtualizadoEm(base),
    };
  }, [perfilId]);

  const valorAereo = (dadosDoPeriodo.valor * canalAereo.participacaoPct) / 100;
  const valorTerrestre = dadosDoPeriodo.valor - valorAereo;

  const margemTotalPct = ponderar(
    valorAereo,
    valorTerrestre,
    canalAereo.margemPct,
    canalTerrestre.margemPct,
  );
  const margemTotalLYPct = ponderar(
    valorAereo,
    valorTerrestre,
    canalAereo.margemLYPct,
    canalTerrestre.margemLYPct,
  );
  const margemTotalVariacaoPct = ponderar(
    valorAereo,
    valorTerrestre,
    canalAereo.margemVariacaoPct,
    canalTerrestre.margemVariacaoPct,
  );
  const rentabTotalLYValor =
    (valorAereo * canalAereo.rentabLYPct) / 100 +
    (valorTerrestre * canalTerrestre.rentabLYPct) / 100;
  const rentabTotalLYVariacaoPct = ponderar(
    valorAereo,
    valorTerrestre,
    canalAereo.rentabLYVariacaoPct,
    canalTerrestre.rentabLYVariacaoPct,
  );

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
              <SensitiveValue value={formatarMoedaCompleta(dadosDoPeriodo.valor)} />
            </p>
            <MargemRentabBloco
              margemLabel="MARGEM TOTAL"
              margemPct={margemTotalPct}
              margemLYPct={margemTotalLYPct}
              margemVariacaoPct={margemTotalVariacaoPct}
              rentabLYValor={rentabTotalLYValor}
              rentabLYVariacaoPct={rentabTotalLYVariacaoPct}
              tamanho="grande"
              mock
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
            <SensitiveValue value={formatarPercentual(Math.abs(dadosDoPeriodo.variacaoPct))} />
          </span>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <CanalResumoCard
          canal={canalAereo}
          heroValor={dadosDoPeriodo.valor}
          titulo="Aéreo"
          unidade="bilhetes"
          icon={Plane}
          tema="rosa"
        />
        <CanalResumoCard
          canal={canalTerrestre}
          heroValor={dadosDoPeriodo.valor}
          titulo="Terrestre"
          unidade="vendas"
          icon={Bus}
          tema="azul"
        />
      </div>
    </div>
  );
}
