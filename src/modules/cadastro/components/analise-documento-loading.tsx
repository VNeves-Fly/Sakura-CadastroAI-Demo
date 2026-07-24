"use client";

interface AnaliseDocumentoLoadingProps {
  mensagem?: string;
}

// Card pequeno e centralizado, sobreposto à tela, mostrado enquanto um
// documento é analisado pela IA (contrato social, RG/CNH) — some sozinho
// assim que quem chama para de renderizar (analisando vira false). Só
// distrai o cliente durante a espera, não substitui o formulário nem
// bloqueia nada além da interação visual.
export function AnaliseDocumentoLoading({
  mensagem = "Analisando o documento...",
}: AnaliseDocumentoLoadingProps) {
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="bg-card border-border animate-in fade-in-0 zoom-in-95 flex w-full max-w-[220px] flex-col items-center gap-3 rounded-2xl border p-6 text-center shadow-2xl duration-200">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG com
        animação SMIL própria; next/image exigiria dangerouslyAllowSVG e
        arrisca rasterizar/otimizar o arquivo, quebrando a animação. */}
        <img src="/loading/aviao-analisando.svg" alt="" aria-hidden="true" className="size-28" />
        <p className="text-foreground text-sm font-medium">{mensagem}</p>
      </div>
    </div>
  );
}
