"use client";

import { useState } from "react";
import {
  Activity,
  CircleSlash,
  CreditCard,
  FileText,
  PauseCircle,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  UserX,
} from "lucide-react";
import { KpiCard } from "@/modules/novas-agencias/components/kpi-card";
import { HighlightKpiCard } from "@/modules/novas-agencias/components/highlight-kpi-card";
import { ListCard } from "@/modules/novas-agencias/components/list-card";
import { CollapsibleSection } from "@/modules/novas-agencias/components/collapsible-section";
import { FiltroListaAgencias } from "@/modules/novas-agencias/components/filtro-lista-agencias";
import { ListaAgenciasTabela } from "@/modules/novas-agencias/components/lista-agencias-tabela";
import { ListaAgenciasPaginacao } from "@/modules/novas-agencias/components/lista-agencias-paginacao";
import { AgenciasParandoTabela } from "@/modules/novas-agencias/components/agencias-parando-tabela";
import { CobrancaResponsavelTabela } from "@/modules/novas-agencias/components/cobranca-responsavel-tabela";
import {
  ToggleVisaoResponsavel,
  type VisaoResponsavel,
} from "@/modules/novas-agencias/components/toggle-visao-responsavel";
import { RelogioPeriodoCsv } from "@/modules/novas-agencias/components/relogio-periodo-csv";
import {
  TAMANHO_PAGINA_NOVAS_AGENCIAS,
  useListaAgenciasViewModel,
} from "@/modules/novas-agencias/view-models/use-lista-agencias.view-model";
import {
  formatarData,
  formatarDistanciaEmDias,
  formatarMoedaAbreviada,
  formatarNumero,
  formatarPercentual,
} from "@/modules/novas-agencias/utils/formatar.util";
import type { NovasAgenciasData } from "@/modules/novas-agencias/types/novas-agencias.types";

interface NovasAgenciasViewProps {
  dados: NovasAgenciasData;
}

// View única desta página — 100% client (filtros/paginação/toggle são
// todos client-side sobre o mock já carregado, sem refetch). Reproduz
// só a camada visual da SPEC recebida (ver
// services/novas-agencias.mock-service.ts pra origem dos dados).
export function NovasAgenciasView({ dados }: NovasAgenciasViewProps) {
  const [visaoResponsavel, setVisaoResponsavel] = useState<VisaoResponsavel>("executivos");
  const listaAgencias = useListaAgenciasViewModel(dados.agencias);

  const agora = new Date();
  const rankingResponsavel = dados.cobrancaPorResponsavel[visaoResponsavel];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Análise de Novas Agências</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ativação, primeiro acesso e primeira compra das agências aprovadas nos últimos 90 dias.
          </p>
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="bg-primary size-1.5 rounded-full" />
            <span>{formatarData(dados.sincronizacao.ultimaEm)}</span>
            <span>·</span>
            <span>{formatarDistanciaEmDias(dados.sincronizacao.ultimaEm, agora)}</span>
            <span>·</span>
            <span>próx. {formatarData(dados.sincronizacao.proximaEm)}</span>
          </div>
        </div>

        <RelogioPeriodoCsv agencias={dados.agencias} />
      </div>

      {/* Linha 1 — 6 cards (SPEC 5) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={Sparkles}
          label="Novas agências"
          valor={formatarNumero(dados.kpis.novasAgencias)}
        />
        <KpiCard
          icon={UserX}
          label="Nunca compraram"
          valor={formatarNumero(dados.kpis.nuncaCompraram)}
          corValor="text-red-500"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Comprando"
          valor={formatarNumero(dados.kpis.comprando)}
          corValor="text-green-600"
        />
        <KpiCard
          icon={TriangleAlert}
          label="Sem comprar +15d"
          valor={formatarNumero(dados.kpis.semComprar15d)}
          corValor="text-orange-500"
        />
        <KpiCard
          icon={PauseCircle}
          label="Sem comprar +30d"
          valor={formatarNumero(dados.kpis.semComprar30d)}
          corValor="text-red-500"
        />
        <KpiCard
          icon={CircleSlash}
          label="Pararam (+60d)"
          valor={formatarNumero(dados.kpis.pararam60d)}
          corValor="text-red-500"
        />
      </div>

      {/* Linha 2 — 3 cards monetários (SPEC 6) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={TrendingUp}
          label="Volume gerado"
          valor={formatarMoedaAbreviada(dados.kpis.volumeGerado)}
        />
        <KpiCard
          icon={TrendingUp}
          label="Pago últimos 30d"
          valor={formatarMoedaAbreviada(dados.kpis.pagoUltimos30d)}
        />
        <KpiCard
          icon={Activity}
          label="Variação 30d"
          valor={formatarPercentual(dados.kpis.variacao30dPct)}
          corValor="text-green-600"
        />
      </div>

      {/* Linha 3 — destaque rosa + 2 cards de lista (SPEC 7) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <HighlightKpiCard
          icon={FileText}
          label="Tempo médio até a 1ª compra"
          valor={`${dados.kpis.tempoMedioPrimeiraCompraDias} dias`}
          subtitulo="contado da entrada do cadastro"
        />
        <ListCard
          icon={CreditCard}
          titulo="Mix de pagamento (novas)"
          itens={dados.mixPagamento.map((item) => ({
            label: item.label,
            valor: formatarMoedaAbreviada(item.valor),
            tooltip: item.comTooltip ? `Volume pago via ${item.label.toLowerCase()}` : undefined,
          }))}
          totalLabel="Total pago"
          totalValor={formatarMoedaAbreviada(dados.totalPago)}
          comDivisorAntesDoTotal
        />
        <ListCard
          icon={CreditCard}
          titulo="Crédito"
          itens={[
            {
              label: "Com limite faturado",
              valor: formatarNumero(dados.credito.comLimiteFaturado),
            },
            {
              label: "Sem limite faturado",
              valor: formatarNumero(dados.credito.semLimiteFaturado),
            },
          ]}
          totalLabel="Limite faturado total"
          totalValor={formatarMoedaAbreviada(dados.credito.limiteFaturadoTotal)}
        />
      </div>

      <CollapsibleSection
        titulo="Lista de agências"
        contador={`${formatarNumero(listaAgencias.agenciasFiltradas.length)} agências`}
      >
        <FiltroListaAgencias
          filtros={listaAgencias.filtros}
          onAtualizarFiltro={listaAgencias.atualizarFiltro}
          opcoesExecutivo={listaAgencias.opcoesExecutivo}
          opcoesGerente={listaAgencias.opcoesGerente}
        />
        <ListaAgenciasTabela agencias={listaAgencias.agenciasDaPagina} />
        <ListaAgenciasPaginacao
          pagina={listaAgencias.pagina}
          totalPaginas={listaAgencias.totalPaginas}
          total={listaAgencias.agenciasFiltradas.length}
          tamanhoPagina={TAMANHO_PAGINA_NOVAS_AGENCIAS}
          onMudarPagina={listaAgencias.setPagina}
        />
      </CollapsibleSection>

      <CollapsibleSection
        titulo="Agências parando de comprar"
        contador={`${formatarNumero(dados.agenciasParandoDeComprar.length)} agências`}
      >
        <AgenciasParandoTabela agencias={dados.agenciasParandoDeComprar} />
      </CollapsibleSection>

      <CollapsibleSection
        titulo="Cobrança por responsável"
        contador={`${formatarNumero(
          dados.cobrancaPorResponsavel.executivos.length +
            dados.cobrancaPorResponsavel.gerentes.length,
        )} responsáveis`}
      >
        <ToggleVisaoResponsavel visao={visaoResponsavel} onChange={setVisaoResponsavel} />
        <CobrancaResponsavelTabela ranking={rankingResponsavel} />
      </CollapsibleSection>
    </div>
  );
}
