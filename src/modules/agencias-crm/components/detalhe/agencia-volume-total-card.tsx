"use client";

import { useMemo } from "react";
import { Bus, Clock, Plane } from "lucide-react";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { formatarMoedaCompleta } from "@/modules/agencias-crm/utils/formatar-moeda.util";
import {
  gerarAtualizadoEm,
  gerarMargemAereo,
  gerarMargemTerrestre,
  gerarNacIntTerrestre,
  gerarVolumePorPeriodo,
} from "@/modules/agencias-crm/utils/canal-margem-mock.util";
import { AgenciaMargemRentabBloco } from "@/modules/agencias-crm/components/detalhe/agencia-margem-rentab-bloco";
import { AgenciaCanalResumoCard } from "@/modules/agencias-crm/components/detalhe/agencia-canal-resumo-card";
import { FiltroPeriodoAgenciaPopover } from "@/modules/agencias-crm/components/detalhe/filtro-periodo-agencia-popover";
import {
  useFiltroPeriodoAgenciaStore,
  resolverPeriodoAgencia,
} from "@/modules/agencias-crm/stores/filtro-periodo-agencia.store";
import type { AgenciaDetalheVendas } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaVolumeTotalCardProps {
  agenciaId: string;
  vendas: AgenciaDetalheVendas;
}

// Média ponderada pelo valor de cada canal — mesma conta de ponderar() em
// executivo/dashboard/receita-total-card.tsx.
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

// Card "Volume total" — aba Dashboard do detalhe de Agência (SPEC
// seção 3.5.A). `vendas.aereoNacional/aereoInternacional/terrestre/
// volumeTotalAno/ticketMedioAereo` são mock determinístico (mesmo mock do
// resto de agencia-detalhe.adapter.ts — não existe venda por agência
// modelada no domínio hoje); margem/rentab. por canal são mock à parte
// (ver canal-margem-mock.util.ts). Por isso o valor grande aqui segue a
// cor sólida `var(--color-primary)` pedida na SPEC, não o gradiente
// rosa→roxo→azul usado no Dashboard CRM/Executivo/Gestor — lá o hero é
// real (ou parcialmente real); aqui o card inteiro é mock, sinalizado
// pelo MockBadge.
export function AgenciaVolumeTotalCard({ agenciaId, vendas }: AgenciaVolumeTotalCardProps) {
  const filtro = useFiltroPeriodoAgenciaStore((estado) => estado.filtro);
  const periodo = resolverPeriodoAgencia(filtro);

  const { margemAereo, margemTerrestre, nacIntTerrestre, volumePorPeriodo, atualizadoEm } =
    useMemo(() => {
      const base = hashParaNumero(agenciaId);
      return {
        margemAereo: gerarMargemAereo(base),
        margemTerrestre: gerarMargemTerrestre(base),
        nacIntTerrestre: gerarNacIntTerrestre(base),
        volumePorPeriodo: gerarVolumePorPeriodo(base, vendas.volumeTotalAno),
        atualizadoEm: gerarAtualizadoEm(base),
      };
    }, [agenciaId, vendas.volumeTotalAno]);

  const valorDoPeriodo = volumePorPeriodo[periodo].valor;

  // Participação de cada canal no total anual (real, do adapter) —
  // aplicada em cima do valor do período selecionado (mock, ver
  // gerarVolumePorPeriodo) pra reagir ao filtro de período junto com o
  // valor grande do card, mesmo padrão de ReceitaTotalCard do Executivo.
  const participacaoAereoPct =
    vendas.volumeTotalAno > 0
      ? ((vendas.aereoNacional.volume + vendas.aereoInternacional.volume) / vendas.volumeTotalAno) *
        100
      : 0;
  const volumeAereo = Math.round((valorDoPeriodo * participacaoAereoPct) / 100);
  const volumeTerrestre = valorDoPeriodo - volumeAereo;
  const bilhetesAereo =
    vendas.ticketMedioAereo > 0 ? Math.round(volumeAereo / vendas.ticketMedioAereo) : 0;
  const ticketMedioTerrestre =
    vendas.terrestre.servicos > 0
      ? Math.round(vendas.terrestre.volume / vendas.terrestre.servicos)
      : 0;
  const servicosTerrestre =
    ticketMedioTerrestre > 0 ? Math.round(volumeTerrestre / ticketMedioTerrestre) : 0;

  const margemTotalPct = ponderar(
    volumeAereo,
    volumeTerrestre,
    margemAereo.margemPct,
    margemTerrestre.margemPct,
  );
  const margemTotalLYPct = ponderar(
    volumeAereo,
    volumeTerrestre,
    margemAereo.margemLYPct,
    margemTerrestre.margemLYPct,
  );
  const margemTotalVariacaoPct = ponderar(
    volumeAereo,
    volumeTerrestre,
    margemAereo.margemVariacaoPct,
    margemTerrestre.margemVariacaoPct,
  );
  const rentabTotalLYValor =
    (volumeAereo * margemAereo.rentabLYPct) / 100 +
    (volumeTerrestre * margemTerrestre.rentabLYPct) / 100;
  const rentabTotalLYVariacaoPct = ponderar(
    volumeAereo,
    volumeTerrestre,
    margemAereo.rentabLYVariacaoPct,
    margemTerrestre.rentabLYVariacaoPct,
  );

  return (
    <div className="border-border rounded-xl border p-[18px_22px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-primary text-[clamp(36px,4vw,42px)] leading-none font-black">
            <SensitiveValue value={formatarMoedaCompleta(valorDoPeriodo)} />
          </p>
          <AgenciaMargemRentabBloco
            margemLabel="MARGEM TOTAL"
            margemPct={margemTotalPct}
            margemLYPct={margemTotalLYPct}
            margemVariacaoPct={margemTotalVariacaoPct}
            rentabLYValor={rentabTotalLYValor}
            rentabLYVariacaoPct={rentabTotalLYVariacaoPct}
            tamanho="grande"
          />
        </div>
        <div className="flex flex-col items-end gap-2">
          <MockBadge />
          <FiltroPeriodoAgenciaPopover />
        </div>
      </div>

      <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
        <Clock className="size-3" />
        Atualizado em {atualizadoEm}
      </p>

      <div className="mt-3.5 flex flex-wrap gap-3.5">
        <AgenciaCanalResumoCard
          titulo="Aéreo"
          icon={Plane}
          tema="rosa"
          volume={volumeAereo}
          quantidade={bilhetesAereo}
          unidade="bilhetes"
          ticketMedio={vendas.ticketMedioAereo}
          nacPct={vendas.aereoNacional.pctAereo}
          intPct={vendas.aereoInternacional.pctAereo}
          margem={margemAereo}
        />
        <AgenciaCanalResumoCard
          titulo="Terrestre"
          icon={Bus}
          tema="azul"
          volume={volumeTerrestre}
          quantidade={servicosTerrestre}
          unidade="serviços"
          ticketMedio={ticketMedioTerrestre}
          nacPct={nacIntTerrestre.nacPct}
          intPct={nacIntTerrestre.intPct}
          margem={margemTerrestre}
        />
      </div>
    </div>
  );
}
