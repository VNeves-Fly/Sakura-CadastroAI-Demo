"use client";

import { ToggleVisibilidadeButton } from "@/modules/shared/components/toggle-visibilidade-button";
import { BotaoNovoCadastro } from "@/modules/shared/components/botao-novo-cadastro";
import { BuscaListaInput } from "@/modules/shared/components/busca-lista-input";

interface GestoresListaToolbarProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  total: number;
  onNovoCadastro: () => void;
}

export function GestoresListaToolbar({
  busca,
  onBuscaChange,
  total,
  onNovoCadastro,
}: GestoresListaToolbarProps) {
  return (
    <div className="border-border flex flex-wrap items-center gap-4 border-b pb-4">
      <BuscaListaInput value={busca} onChange={onBuscaChange} placeholder="Buscar gerente..." />

      <div className="ml-auto flex items-center gap-3">
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          <span className="text-foreground font-semibold">{total}</span> resultado(s)
        </span>

        <ToggleVisibilidadeButton />

        <BotaoNovoCadastro onClick={onNovoCadastro} />
      </div>
    </div>
  );
}
