import { PillDataInput } from "@/modules/dashboard-vendas/components/ui/pill-data-input";
import { mascararData } from "@/modules/dashboard-vendas/utils/mascara-data.util";

interface PersonalizadoDateRangeProps {
  dataInicial: string;
  dataFinal: string;
  onDataInicialChange: (valor: string) => void;
  onDataFinalChange: (valor: string) => void;
}

// Par "Data inicial – Data final" do filtro "Personalizado" — mesmo
// componente nos 3 lugares que hoje têm esse filtro (Resumo do dia, Top
// 10 Agências, Top 10 Fornecedores; pedido do usuário, 2026-08-18).
// Sempre alinhado à direita (lado oposto ao título do card, que fica à
// esquerda). Aplica a máscara dd/mm/aaaa aqui pra não duplicar a chamada
// a `mascararData` em cada consumidor.
export function PersonalizadoDateRange({
  dataInicial,
  dataFinal,
  onDataInicialChange,
  onDataFinalChange,
}: PersonalizadoDateRangeProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <PillDataInput
        label="Data inicial"
        valor={dataInicial}
        onChange={(valor) => onDataInicialChange(mascararData(valor))}
      />
      <span className="text-muted-foreground text-xs font-bold">–</span>
      <PillDataInput
        label="Data final"
        valor={dataFinal}
        onChange={(valor) => onDataFinalChange(mascararData(valor))}
      />
    </div>
  );
}
