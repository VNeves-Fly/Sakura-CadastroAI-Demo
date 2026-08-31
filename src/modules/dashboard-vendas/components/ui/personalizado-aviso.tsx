import { Info } from "lucide-react";

// Rodapé do card de Resumo quando o filtro "Personalizado" está ativo e
// não há dado real pro intervalo escolhido (erro, ou antes da primeira
// aplicação) — enquanto carrega, quem cobre a tela é o
// `CarregandoOverlay` (ver resumo-do-dia-card.tsx), não este aviso.
export function PersonalizadoAviso({ mensagem }: { mensagem: string }) {
  return (
    <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
      <Info className="size-3.5 shrink-0" />
      {mensagem}
    </p>
  );
}
