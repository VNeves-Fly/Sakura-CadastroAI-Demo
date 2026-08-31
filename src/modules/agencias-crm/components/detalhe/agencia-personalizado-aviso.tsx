import { Info } from "lucide-react";

// Mesmo padrão de personalizado-aviso.tsx em dashboard-vendas (duplicado
// de propósito, isolamento de módulo) — aparece no card "Volume total"
// quando o filtro "Personalizado" está ativo e não há dado real pro
// intervalo (erro, agência sem SICA, ou antes da primeira aplicação).
// Enquanto carrega, quem cobre o card é o AgenciaCarregandoOverlay.
export function AgenciaPersonalizadoAviso({ mensagem }: { mensagem: string }) {
  return (
    <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
      <Info className="size-3.5 shrink-0" />
      {mensagem}
    </p>
  );
}
