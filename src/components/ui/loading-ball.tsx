import { cn } from "@/lib/utils";

type LoadingBallSize = "xs" | "sm" | "default" | "lg" | "xl";

const TAMANHOS: Record<LoadingBallSize, string> = {
  xs: "size-2",
  sm: "size-3",
  default: "size-4",
  lg: "size-6",
  xl: "size-8",
};

interface LoadingBallProps {
  size?: LoadingBallSize;
  className?: string;
}

// Spinner "bolinha pulsando" — mesmo espírito visual do `loading
// loading-ball` do FlyonUI/DaisyUI (referência trazida pelo usuário,
// 2026-08-25), mas em Tailwind puro: o projeto não tem FlyonUI/DaisyUI
// instalado, e a decisão foi não trazer a lib só por causa desse
// spinner (ver AskUserQuestion na entrega). Uso pretendido: indicador de
// carregando POR VALOR dentro de um card/KPI que já está montado — não
// substitui o `Skeleton` (que troca o bloco inteiro por um placeholder
// cinza enquanto a seção inteira ainda não tem layout nenhum).
export function LoadingBall({ size = "default", className }: LoadingBallProps) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={cn(
        "bg-primary/70 inline-block animate-bounce rounded-full",
        TAMANHOS[size],
        className,
      )}
    />
  );
}
