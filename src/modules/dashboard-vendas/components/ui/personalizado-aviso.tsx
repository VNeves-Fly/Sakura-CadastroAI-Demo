import { Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Rodapé do card de Resumo quando o filtro "Personalizado" está ativo —
// só aparece enquanto não há dado real pro intervalo escolhido
// (carregando, erro, ou antes da primeira aplicação); uma vez que
// `personalizado.dados` chega (ver filtro-periodo-dashboard.store.ts),
// o card já mostra o intervalo de verdade e este aviso some.
export function PersonalizadoAviso({
  mensagem,
  carregando,
}: {
  mensagem: string;
  carregando?: boolean;
}) {
  const Icone = carregando ? Loader2 : Info;
  return (
    <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
      <Icone className={cn("size-3.5 shrink-0", carregando && "animate-spin")} />
      {mensagem}
    </p>
  );
}
