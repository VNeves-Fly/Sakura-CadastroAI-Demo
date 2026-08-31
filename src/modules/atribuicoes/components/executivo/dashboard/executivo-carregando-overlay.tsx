import { Loader2 } from "lucide-react";

// Mesmo padrão de agencia-carregando-overlay.tsx em agencias-crm —
// duplicado aqui de propósito (isolamento entre módulos, ver comentários
// irmãos em filtro-periodo-executivo.store.ts). Cobre o card "Receita
// total" já montado enquanto o filtro "Personalizado" busca o intervalo
// real no SST — o pai precisa ser `relative` pro `inset-0` funcionar.
export function ExecutivoCarregandoOverlay({ ativo }: { ativo: boolean }) {
  if (!ativo) return null;
  return (
    <div className="bg-card/80 absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
      <Loader2 className="text-primary size-6 animate-spin" />
    </div>
  );
}
