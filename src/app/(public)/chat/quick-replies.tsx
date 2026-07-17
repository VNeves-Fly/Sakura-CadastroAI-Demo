"use client";

interface QuickRepliesProps {
  opcoes: { valor: string; label: string }[];
  onEscolher: (valor: string) => void;
}

export function QuickReplies({ opcoes, onEscolher }: QuickRepliesProps) {
  return (
    <div className="mb-4 ml-9 flex flex-wrap gap-2">
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          onClick={() => onEscolher(opcao.valor)}
          className="border-accent/40 hover:bg-primary/20 rounded-full border bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white transition"
        >
          {opcao.label}
        </button>
      ))}
    </div>
  );
}
