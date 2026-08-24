"use client";

import { Search } from "lucide-react";
import { BotaoNovoCadastro } from "@/modules/shared/components/botao-novo-cadastro";

interface GestoresListaToolbarProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  onNovoCadastro: () => void;
}

// Toolbar pixel-perfect (mockup Claude Design, 2026-08-24, "Gestores") —
// mesmo visual da toolbar de Executivos: só busca + Novo cadastro. O
// contador "N resultado(s)" e o ToggleVisibilidadeButton saíram da UI (não
// existem no mockup, e o mockup não mascara valor nenhum nesta lista).
// Pedido do usuário, 2026-08-24: restilizar "pixel perfect".
export function GestoresListaToolbar({
  busca,
  onBuscaChange,
  onNovoCadastro,
}: GestoresListaToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex h-[38px] min-w-[250px] items-center gap-2.5 rounded-full border border-[#F5D6E7] bg-white px-4">
        <Search className="size-[15px] shrink-0 text-[#6B6B85]" strokeWidth={1.8} />
        <input
          value={busca}
          onChange={(event) => onBuscaChange(event.target.value)}
          placeholder="Buscar gerente..."
          className="w-full bg-transparent text-sm text-[#1A1A2E] placeholder:text-[#6B6B85] focus:outline-none"
        />
      </div>

      <BotaoNovoCadastro onClick={onNovoCadastro} variant="solid" />
    </div>
  );
}
