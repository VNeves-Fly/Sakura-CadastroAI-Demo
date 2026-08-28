import { Loader2 } from "lucide-react";

// Mesmo padrão de carregando-overlay.tsx em dashboard-vendas — duplicado
// aqui de propósito (isolamento entre módulos, ver comentários irmãos em
// filtro-periodo-agencia-popover.tsx). Cobre o card "Volume total" já
// montado enquanto o filtro "Personalizado" busca o intervalo real no
// SST — o pai precisa ser `relative` pro `inset-0` funcionar.
export function AgenciaCarregandoOverlay({ ativo }: { ativo: boolean }) {
  if (!ativo) return null;
  return (
    <div className="bg-card/80 absolute inset-0 z-10 flex items-center justify-center rounded-xl">
      <Loader2 className="text-primary size-6 animate-spin" />
    </div>
  );
}
