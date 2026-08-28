import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsuariosPaginacaoProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  tamanhoPagina: number;
  onMudarPagina: (pagina: number) => void;
}

function BotaoPagina({
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
        "flex size-7 shrink-0 items-center justify-center rounded-full border bg-white transition",
        desabilitado
          ? "cursor-not-allowed border-[#EDEDF4] text-[#C9C9DA]"
          : "cursor-pointer border-[#EAD6E2] text-[#E91E8C]",
      )}
    >
      {children}
    </button>
  );
}

// Rodapé de paginação (SPEC §2.3) — 20 itens por página, glifos Lucide
// chevron(s)-left/right a 13px. Cores próprias desta SPEC (bordas/ícone
// rosados), diferentes do PaginacaoSimples compartilhado (que segue o
// handoff de Gestores/Executivos, tons neutros) — por isso bespoke aqui.
export function UsuariosPaginacao({
  pagina,
  totalPaginas,
  total,
  tamanhoPagina,
  onMudarPagina,
}: UsuariosPaginacaoProps) {
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanhoPagina + 1;
  const fim = Math.min(pagina * tamanhoPagina, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EFEFF6] bg-[#FAFAFD] px-5 py-3.5">
      <span className="text-[0.8125rem] text-[#8A8AA3] tabular-nums">
        {total === 0 ? "0 de 0" : `${inicio}-${fim} de ${total}`}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-[0.8125rem] whitespace-nowrap text-[#8A8AA3] tabular-nums">
          Pág. {pagina} de {totalPaginas}
        </span>
        <div className="flex items-center gap-2">
          <BotaoPagina
            destino={1}
            pagina={pagina}
            totalPaginas={totalPaginas}
            ariaLabel="Primeira página"
            onMudarPagina={onMudarPagina}
          >
            <ChevronsLeft className="size-[13px]" />
          </BotaoPagina>
          <BotaoPagina
            destino={pagina - 1}
            pagina={pagina}
            totalPaginas={totalPaginas}
            ariaLabel="Página anterior"
            onMudarPagina={onMudarPagina}
          >
            <ChevronLeft className="size-[13px]" />
          </BotaoPagina>
          <BotaoPagina
            destino={pagina + 1}
            pagina={pagina}
            totalPaginas={totalPaginas}
            ariaLabel="Próxima página"
            onMudarPagina={onMudarPagina}
          >
            <ChevronRight className="size-[13px]" />
          </BotaoPagina>
          <BotaoPagina
            destino={totalPaginas}
            pagina={pagina}
            totalPaginas={totalPaginas}
            ariaLabel="Última página"
            onMudarPagina={onMudarPagina}
          >
            <ChevronsRight className="size-[13px]" />
          </BotaoPagina>
        </div>
      </div>
    </div>
  );
}
