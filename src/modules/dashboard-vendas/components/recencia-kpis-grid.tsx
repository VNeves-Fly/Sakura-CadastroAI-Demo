"use client";

import { useState } from "react";
import { MultiMetricCard } from "@/modules/dashboard-vendas/components/ui/multi-metric-card";
import { AgenciasDetalheModal } from "@/modules/dashboard-vendas/components/agencias-detalhe-modal";
import { formatarNumero } from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import { anoAnterior, anoAtual } from "@/modules/dashboard-vendas/utils/formatar-data.util";
import type {
  AgenciaRecenciaDetalhe,
  ChaveRecencia,
  RecenciaAgencias,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface RecenciaKpisGridProps {
  recencia: RecenciaAgencias;
  recenciaDetalhe: Record<ChaveRecencia, AgenciaRecenciaDetalhe[]>;
}

// Título de cada modal = título do card (pedido do usuário) — mesmo
// texto exibido nos MultiMetricCard abaixo. Ano calculado em runtime
// (anoAtual/anoAnterior) — sem isso, "Compraram em 2026" ficaria
// literalmente escrito 2026 pra sempre.
function tituloModal(chave: ChaveRecencia): string {
  const titulos: Record<ChaveRecencia, string> = {
    compraram30d: "Compraram (30d)",
    compraramAno: `Compraram em ${anoAtual()}`,
    semVendas30dMais: "+30 dias sem vendas",
    semVendasAno: `Sem vendas em ${anoAtual()}`,
  };
  return titulos[chave];
}

// 4.6 — recência/churn de agências, 4 cards de contexto. Cada card abre
// um modal de detalhamento por agência ao clicar (layout replicado do
// print de referência — busca + filtro de canal + tabela + paginação).
export function RecenciaKpisGrid({ recencia, recenciaDetalhe }: RecenciaKpisGridProps) {
  const [modalAberto, setModalAberto] = useState<ChaveRecencia | null>(null);
  const { compraram30d, compraramAno, semVendas30dMais, semVendasAno } = recencia;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MultiMetricCard
          titulo="Compraram (30D)"
          valor={formatarNumero(compraram30d.total)}
          aoClicar={() => setModalAberto("compraram30d")}
          submetricas={[
            { label: "só aéreo", valor: formatarNumero(compraram30d.soAereo) },
            { label: "só terrestre", valor: formatarNumero(compraram30d.soTerrestre) },
            { label: "e ambos", valor: formatarNumero(compraram30d.ambos) },
          ]}
        />
        <MultiMetricCard
          titulo={`Compraram em ${anoAtual()}`}
          valor={formatarNumero(compraramAno.total)}
          aoClicar={() => setModalAberto("compraramAno")}
          submetricas={[
            { label: "só aéreo", valor: formatarNumero(compraramAno.soAereo) },
            { label: "só terrestre", valor: formatarNumero(compraramAno.soTerrestre) },
            { label: "e ambos", valor: formatarNumero(compraramAno.ambos) },
          ]}
        />
        <MultiMetricCard
          titulo="+30 dias sem vendas"
          valor={formatarNumero(semVendas30dMais.total)}
          aoClicar={() => setModalAberto("semVendas30dMais")}
          submetricas={[
            { label: "31–89D sem vender", valor: formatarNumero(semVendas30dMais.faixa31a89) },
            { label: "90–179D sem vender", valor: formatarNumero(semVendas30dMais.faixa90a179) },
            { label: "+180D sem vender", valor: formatarNumero(semVendas30dMais.faixa180Mais) },
          ]}
        />
        <MultiMetricCard
          titulo={`Sem vendas em ${anoAtual()}`}
          valor={formatarNumero(semVendasAno.total)}
          aoClicar={() => setModalAberto("semVendasAno")}
          submetricas={[
            { label: "só aéreo", valor: formatarNumero(semVendasAno.soAereo) },
            { label: "só terrestre", valor: formatarNumero(semVendasAno.soTerrestre) },
            { label: "e ambos", valor: formatarNumero(semVendasAno.ambos) },
          ]}
          linhasExtras={[
            {
              label: `compraram em ${anoAnterior()}`,
              valor: formatarNumero(semVendasAno.compraramAnoAnterior),
            },
            {
              label: `compraram em ${anoAtual()}`,
              valor: formatarNumero(semVendasAno.compraramAnoAtual),
            },
            { label: `só em ${anoAnterior()}`, valor: formatarNumero(semVendasAno.soAnoAnterior) },
          ]}
        />
      </div>

      <AgenciasDetalheModal
        aberto={modalAberto !== null}
        onOpenChange={(aberto) => setModalAberto(aberto ? modalAberto : null)}
        titulo={modalAberto ? tituloModal(modalAberto) : ""}
        itens={modalAberto ? recenciaDetalhe[modalAberto] : []}
      />
    </>
  );
}
