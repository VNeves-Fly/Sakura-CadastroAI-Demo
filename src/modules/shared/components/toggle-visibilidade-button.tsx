"use client";

import { Eye, EyeOff } from "lucide-react";
import { useDataVisibility } from "@/modules/shared/stores/data-visibility.store";
import { cn } from "@/lib/utils";

interface ToggleVisibilidadeButtonProps {
  className?: string;
}

// Botão de olho reaproveitável (SPEC 8.1: "reaproveitar o mesmo padrão
// dentro do detalhe do executivo") — extraído da toolbar da lista pra
// poder aparecer também no header do perfil, ambos lendo/escrevendo o
// mesmo store global de visibilidade.
export function ToggleVisibilidadeButton({ className }: ToggleVisibilidadeButtonProps) {
  const { dadosVisiveis, alternarVisibilidade } = useDataVisibility();

  return (
    <button
      type="button"
      onClick={alternarVisibilidade}
      aria-pressed={dadosVisiveis}
      title={dadosVisiveis ? "Ocultar valores sensíveis" : "Mostrar valores sensíveis"}
      className={cn(
        "border-border text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-full border transition",
        className,
      )}
    >
      {dadosVisiveis ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
    </button>
  );
}
