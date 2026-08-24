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
  MargemRentabGestor,
  PeriodoVendasMesHeroGestor,
  VendasMesHeroGestor,
} from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorReceitaTotalCardProps {
  hero: Record<PeriodoVendasMesHeroGestor, VendasMesHeroGestor>;
  margemRentab: MargemRentabGestor;
  atualizadoEm: string;
}

// Card "Receita total" (SPEC 3.5+3.6) — mesmo componente/lógica de
// ReceitaTotalCard do dashboard de Executivo (duplicado por isolamento de
// módulo), com o filtro de período próprio do Gestor (ver
// filtro-periodo-gestor.store.ts) e os dois cartões de canal. Margem/
// rentab. por canal são reais desde 2026-08-24 — agregação (soma) da
// carteira dos executivos subordinados (ver somarMargemRentab em
// agregacoes-gestor.util.ts) — só o timestamp "Atualizado em" continua
// mock (sem fonte real de "hora de sincronização" no SST).
export function GestorReceitaTotalCard({
  hero,
  margemRentab,
  atualizadoEm,
}: GestorReceitaTotalCardProps) {
  const filtro = useFiltroPeriodoGestorStore((estado) => estado.filtro);
  const periodo = resolverPeriodoGestor(filtro);
  const dadosDoPeriodo = hero[periodo];
  const margemDoPeriodo = margemRentab[periodo];
  const negativo = dadosDoPeriodo.variacaoPct < 0;

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
          canal={margemDoPeriodo.aereo}
          titulo="Aéreo"
          unidade="bilhetes"
          icon={Plane}
          tema="rosa"
        />
        <GestorCanalResumoCard
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
