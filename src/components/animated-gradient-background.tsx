// Fundo em tela cheia com gradiente animado só via CSS (Tailwind
// `animate-gradient-flow`, keyframe em tailwind.config.ts) — sem JS
// controlando a animação. Fixed + z-index negativo: fica atrás de
// qualquer conteúdo do documento, independente de scroll.
export function AnimatedGradientBackground() {
  return (
    <div
      className="animate-gradient-flow fixed inset-0 -z-10 h-screen w-screen bg-[linear-gradient(334deg,#6b97f7,#7525e2,#f7137e)] bg-[length:180%_180%]"
      aria-hidden="true"
    />
  );
}
