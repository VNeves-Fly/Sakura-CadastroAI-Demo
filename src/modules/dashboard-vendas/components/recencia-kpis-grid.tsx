import { MultiMetricCard } from "@/modules/dashboard-vendas/components/ui/multi-metric-card";
import { formatarNumero } from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import type { RecenciaAgencias } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface RecenciaKpisGridProps {
  recencia: RecenciaAgencias;
}

// 4.6 — recência/churn de agências, 4 cards de contexto.
export function RecenciaKpisGrid({ recencia }: RecenciaKpisGridProps) {
  const { compraram30d, compraramAno, semVendas30dMais, semVendasAno } = recencia;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MultiMetricCard
        titulo="Compraram (30D)"
        valor={formatarNumero(compraram30d.total)}
        submetricas={[
          { label: "só aéreo", valor: formatarNumero(compraram30d.soAereo) },
          { label: "só terrestre", valor: formatarNumero(compraram30d.soTerrestre) },
          { label: "e ambos", valor: formatarNumero(compraram30d.ambos) },
        ]}
      />
      <MultiMetricCard
        titulo="Compraram em 2026"
        valor={formatarNumero(compraramAno.total)}
        submetricas={[
          { label: "só aéreo", valor: formatarNumero(compraramAno.soAereo) },
          { label: "só terrestre", valor: formatarNumero(compraramAno.soTerrestre) },
          { label: "e ambos", valor: formatarNumero(compraramAno.ambos) },
        ]}
      />
      <MultiMetricCard
        titulo="+30 dias sem vendas"
        valor={formatarNumero(semVendas30dMais.total)}
        submetricas={[
          { label: "31–89D sem vender", valor: formatarNumero(semVendas30dMais.faixa31a89) },
          { label: "90–179D sem vender", valor: formatarNumero(semVendas30dMais.faixa90a179) },
          { label: "+180D sem vender", valor: formatarNumero(semVendas30dMais.faixa180Mais) },
        ]}
      />
      <MultiMetricCard
        titulo="Sem vendas em 2026"
        valor={formatarNumero(semVendasAno.total)}
        submetricas={[
          { label: "só aéreo", valor: formatarNumero(semVendasAno.soAereo) },
          { label: "só terrestre", valor: formatarNumero(semVendasAno.soTerrestre) },
          { label: "e ambos", valor: formatarNumero(semVendasAno.ambos) },
        ]}
        linhasExtras={[
          { label: "compraram em 2025", valor: formatarNumero(semVendasAno.compraramAnoAnterior) },
          { label: "compraram em 2026", valor: formatarNumero(semVendasAno.compraramAnoAtual) },
          { label: "só em 2025", valor: formatarNumero(semVendasAno.soAnoAnterior) },
        ]}
      />
    </div>
  );
}
