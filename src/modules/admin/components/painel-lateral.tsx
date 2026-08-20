"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";

interface PainelLateralProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  icon?: ReactNode;
  children: ReactNode;
}

// Menu lateral genérico (overlay + painel deslizando da direita, altura
// cheia da tela) — layout puro, sem regra de negócio: quem usa decide o
// conteúdo via `children` (o próprio `flex flex-col` do wrapper já deixa
// uma lista com `flex-1 min-h-0 overflow-y-auto` crescer e um rodapé fixo
// — ex. formulário — manter altura natural, ver ObservacoesCadastro em
// dossie-campos.tsx pro primeiro uso real). Fecha ao clicar no overlay, no
// X do cabeçalho, ou por controle externo via `aberto`.
export function PainelLateral({ aberto, onFechar, titulo, icon, children }: PainelLateralProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onFechar}>
      <div
        className="bg-card fixed inset-y-0 right-0 flex h-full w-full max-w-md flex-col shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
          <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
            {icon}
            {titulo}
          </span>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full p-1 transition"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
