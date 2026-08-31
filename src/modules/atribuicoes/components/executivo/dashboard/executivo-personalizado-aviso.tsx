import { Info } from "lucide-react";

// Mesmo padrão de agencia-personalizado-aviso.tsx em agencias-crm
// (duplicado de propósito, isolamento de módulo) — aparece no card
// "Receita total" quando o filtro "Personalizado" está ativo e não há
// dado real pro intervalo (erro, executivo sem SICA, ou antes da primeira
// aplicação). Enquanto carrega, quem cobre o card é o
// ExecutivoCarregandoOverlay.
export function ExecutivoPersonalizadoAviso({ mensagem }: { mensagem: string }) {
  return (
    <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
      <Info className="size-3.5 shrink-0" />
      {mensagem}
    </p>
  );
}
