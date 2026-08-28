"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { CHIPS_CARGO, type CargoFiltro } from "@/modules/users/types/user-lista.types";

interface UsuariosToolbarProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  cargoFiltro: CargoFiltro;
  onCargoFiltroChange: (valor: CargoFiltro) => void;
}

// Toolbar da tabela (SPEC §2.3, ajustada): busca + botão "Filtro" (pílula
// rosa, mesmo padrão visual do "Novo usuário" desta página) que
// abre/fecha os chips de cargo por baixo — antes ficavam sempre visíveis
// na mesma linha, junto com o select "Ordenar" que já saiu (pedido do
// usuário, 2026-08-26, print de referência FILTRO.gif). Ordenação
// continua fixa A-Z, sem controle na UI (ver use-usuarios-lista.view-model.ts).
export function UsuariosToolbar({
  busca,
  onBuscaChange,
  cargoFiltro,
  onCargoFiltroChange,
}: UsuariosToolbarProps) {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  return (
    <div className="flex flex-col gap-3.5 border-b border-[#EFEFF6] px-5 py-4">
      <div className="flex flex-wrap items-center gap-3.5">
        <div className="relative min-w-[280px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9A9AB5]" />
          <input
            type="text"
            value={busca}
            onChange={(event) => onBuscaChange(event.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone"
            className="w-full rounded-full border border-[#E4E4EE] bg-[#F7F7FB] py-[0.6rem] pr-[0.9rem] pl-[2.35rem] text-sm text-[#1F1F33] transition outline-none placeholder:text-[#9A9AB5] focus:border-[#E91E8C] focus:bg-white focus:ring-[3px] focus:ring-[rgba(233,30,140,0.15)]"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltrosAbertos((atual) => !atual)}
          aria-expanded={filtrosAbertos}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#E91E8C] px-[0.9rem] py-[0.45rem] text-[0.8125rem] font-semibold text-white shadow-[0_2px_10px_rgba(233,30,140,0.30)] transition hover:opacity-90 active:scale-[0.96]"
        >
          <SlidersHorizontal className="size-3.5" />
          Filtro
          <ChevronDown
            className={`size-3.5 transition-transform ${filtrosAbertos ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {filtrosAbertos ? (
        <div className="flex flex-wrap items-center gap-2">
          {CHIPS_CARGO.map((chip) => {
            const ativo = chip.valor === cargoFiltro;
            return (
              <button
                key={chip.valor}
                type="button"
                onClick={() => onCargoFiltroChange(chip.valor)}
                className={
                  ativo
                    ? "rounded-full border border-[#E91E8C] bg-[#E91E8C] px-[0.9rem] py-[0.45rem] text-[0.8125rem] font-semibold text-white shadow-[0_2px_10px_rgba(233,30,140,0.30)] transition"
                    : "rounded-full border border-[#E4E4EE] bg-white px-[0.9rem] py-[0.45rem] text-[0.8125rem] font-semibold text-[#6B6B85] transition hover:border-[#E91E8C]/40"
                }
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
