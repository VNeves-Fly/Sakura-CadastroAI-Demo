"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PaginacaoSimplesProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  tamanhoPagina: number;
  onMudarPagina: (pagina: number) => void;
}

function Botao({
  destino,
  pagina,
  totalPaginas,
  ariaLabel,
  onMudarPagina,
  children,
}: {
  destino: number;
  pagina: number;
  totalPaginas: number;
  ariaLabel: string;
  onMudarPagina: (pagina: number) => void;
  children: ReactNode;
}) {
  const desabilitado = destino < 1 || destino > totalPaginas || destino === pagina;
  return (
    <button
      type="button"
      disabled={desabilitado}
      onClick={() => onMudarPagina(destino)}
      aria-label={ariaLabel}
      className={cn(
        "flex size-[23px] shrink-0 items-center justify-center rounded-full border border-[#E7E7F1] bg-white text-[11px] transition hover:bg-[#FAFAFD] active:scale-[0.94]",
        desabilitado ? "cursor-not-allowed text-[#C9C9DA] hover:bg-white" : "text-[#2A2A40]",
      )}
    >
      {children}
    </button>
  );
}

// Rodapé de paginação pixel-perfect (mockup Claude Design, 2026-08-24,
// "Executivos"/"Gestores") — extraído de executivos-paginacao.tsx pra virar
// componente compartilhado, já que as duas listas usam exatamente o mesmo
// visual (glifos «‹›» em vez dos ícones lucide da versão anterior, raio de
// borda batendo com o topo arredondado da tabela). Client-side, mesmo
// padrão de AgenciasPaginacao (agencias-crm) — sem seletor de tamanho de
// página aqui, o mockup não tem um.
export function PaginacaoSimples({
  pagina,
  totalPaginas,
  total,
  tamanhoPagina,
  onMudarPagina,
}: PaginacaoSimplesProps) {
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanhoPagina + 1;
  const fim = Math.min(pagina * tamanhoPagina, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-lg border-t border-[#ECECF4] bg-white px-4 py-[11px]">
      <span className="text-[11.5px] text-[#6B6B85] tabular-nums">
        {inicio.toLocaleString("pt-BR")}-{fim.toLocaleString("pt-BR")} de{" "}
        {total.toLocaleString("pt-BR")}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-[11.5px] whitespace-nowrap text-[#6B6B85] tabular-nums">
          Pág. {pagina} de {totalPaginas}
        </span>
        <div className="flex items-center gap-2">
          <Botao
            destino={1}
            pagina={pagina}
            totalPaginas={totalPaginas}
            ariaLabel="Primeira página"
            onMudarPagina={onMudarPagina}
          >
            «
          </Botao>
          <Botao
            destino={pagina - 1}
            pagina={pagina}
            totalPaginas={totalPaginas}
            ariaLabel="Página anterior"
            onMudarPagina={onMudarPagina}
          >
            ‹
          </Botao>
          <Botao
            destino={pagina + 1}
            pagina={pagina}
            totalPaginas={totalPaginas}
            ariaLabel="Próxima página"
            onMudarPagina={onMudarPagina}
          >
            ›
          </Botao>
          <Botao
            destino={totalPaginas}
            pagina={pagina}
            totalPaginas={totalPaginas}
            ariaLabel="Última página"
            onMudarPagina={onMudarPagina}
          >
            »
          </Botao>
        </div>
      </div>
    </div>
  );
}
