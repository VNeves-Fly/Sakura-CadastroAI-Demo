"use client";

import type { ReactNode } from "react";
import { useDataVisibility } from "@/modules/shared/stores/data-visibility.store";
import { cn } from "@/lib/utils";

interface SensitiveValueProps {
  value: ReactNode;
  mascara?: string;
  className?: string;
}

// Wrapper genérico pra qualquer valor financeiro/métrica sensível: troca o
// render entre o valor real e uma máscara conforme o toggle global de
// visibilidade (ver data-visibility.store.ts). Usar em qualquer coluna/KPI
// que a spec marcar como sensível — nunca esconder "na mão" com condicional
// solto pelo componente.
export function SensitiveValue({ value, mascara = "••••", className }: SensitiveValueProps) {
  const { dadosVisiveis } = useDataVisibility();

  return <span className={cn(className)}>{dadosVisiveis ? value : mascara}</span>;
}
