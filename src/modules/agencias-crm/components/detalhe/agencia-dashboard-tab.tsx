import { AgenciaVolumeTotalCard } from "@/modules/agencias-crm/components/detalhe/agencia-volume-total-card";
import { AgenciaTopCompanhiasCard } from "@/modules/agencias-crm/components/detalhe/agencia-top-companhias-card";
import type { AgenciaDetalheVendas } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaDashboardTabProps {
  agenciaId: string;
  vendas: AgenciaDetalheVendas;
}

// Aba "Dashboard" do detalhe de Agência — aba padrão ao abrir a página
// (SPEC_AGENCIAS_SAKURA seção 3.5).
export function AgenciaDashboardTab({ agenciaId, vendas }: AgenciaDashboardTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <AgenciaVolumeTotalCard agenciaId={agenciaId} vendas={vendas} />
      <AgenciaTopCompanhiasCard companhias={vendas.topCompanhias} />
    </div>
  );
}
