"use client";

import { ArrowDownRight, ArrowUpRight, Bus, Clock, Plane } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { FiltroPeriodoGestorPopover } from "@/modules/gestores/components/dashboard/filtro-periodo-gestor-popover";
import { GestorCanalResumoCard } from "@/modules/gestores/components/dashboard/gestor-canal-resumo-card";
import { MargemRentabBlocoGestor } from "@/modules/gestores/components/dashboard/margem-rentab-bloco-gestor";
import {
  useFiltroPeriodoGestorStore,
  resolverPeriodoGestor,
} from "@/modules/gestores/stores/filtro-periodo-gestor.store";
import {
  formatarMoedaCompleta,
  formatarPercentual,
} from "@/modules/gestores/utils/formatar-moeda.util";
import type {
  CanalResumoGestor,
  PeriodoVendasMesHeroGestor,
  VendasMesHeroGestor,
} from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorReceitaTotalCardProps {
  hero: Record<PeriodoVendasMesHeroGestor, VendasMesHeroGestor>;
  canalAereo: CanalResumoGestor;
  canalTerrestre: CanalResumoGestor;
  atualizadoEm: string;
}

// Média ponderada pelo valor de cada canal no período ativo — mesma conta
// de ponderar() em executivo/dashboard/receita-total-card.tsx.
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

// Card "Receita total" (SPEC 3.5+3.6) — mesmo componente/lógica de
// ReceitaTotalCard do dashboard de Executivo (duplicado por isolamento de
// módulo), com o filtro de período próprio do Gestor (ver
// filtro-periodo-gestor.store.ts) e os dois cartões de canal. O valor
// grande e a variação % são reais (via SST); só margem/rentab. total (e
// os dois cards de canal abaixo) continuam mock — por isso o badge "MK"
// fica só no bloco MARGEM TOTAL, não no card inteiro (mesma convenção do
// Executivo, ver margem-rentab-bloco.tsx).
export function GestorReceitaTotalCard({
  hero,
  canalAereo,
  canalTerrestre,
  atualizadoEm,
}: GestorReceitaTotalCardProps) {
  const filtro = useFiltroPeriodoGestorStore((estado) => estado.filtro);
  const periodo = resolverPeriodoGestor(filtro);
  const dadosDoPeriodo = hero[periodo];
  const negativo = dadosDoPeriodo.variacaoPct < 0;

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
              margem/rentab. de 2 linhas ficam centralizados um em relação
              ao outro como grupo. Gradiente/tamanho do valor padronizados
              com o "valor total" do Dashboard CRM e do Executivo (pedido
              do usuário, 2026-08-21). */}
          <div className="flex flex-wrap items-center gap-4">
            <p
              className="bg-clip-text text-4xl font-black break-words text-transparent sm:text-[42px]"
              style={{ backgroundImage: "linear-gradient(90deg, #EC0C8C, #8B5CF6, #3B82F6)" }}
            >
              <SensitiveValue value={formatarMoedaCompleta(dadosDoPeriodo.valor)} />
            </p>
            <MargemRentabBlocoGestor
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
          <FiltroPeriodoGestorPopover />
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
        <GestorCanalResumoCard
          canal={canalAereo}
          heroValor={dadosDoPeriodo.valor}
          titulo="Aéreo"
          unidade="bilhetes"
          icon={Plane}
          tema="rosa"
        />
        <GestorCanalResumoCard
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
