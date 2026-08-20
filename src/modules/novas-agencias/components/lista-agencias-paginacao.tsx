"use client";

import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListaAgenciasPaginacaoProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  tamanhoPagina: number;
  onMudarPagina: (pagina: number) => void;
}

// Rodapé de paginação da "Lista de agências" (SPEC 8.5) — cliente, mesmo
// visual do padrão de paginação já usado no resto do app (ver
// agencias-crm/components/agencias-paginacao.tsx).
export function ListaAgenciasPaginacao({
  pagina,
  totalPaginas,
  total,
  tamanhoPagina,
  onMudarPagina,
}: ListaAgenciasPaginacaoProps) {
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanhoPagina + 1;
  const fim = Math.min(pagina * tamanhoPagina, total);

  function Botao({
    destino,
    ariaLabel,
    children,
  }: {
    destino: number;
    ariaLabel: string;
    children: React.ReactNode;
  }) {
    const desabilitado = destino < 1 || destino > totalPaginas || destino === pagina;
    return (
      <button
        type="button"
        disabled={desabilitado}
        onClick={() => onMudarPagina(destino)}
        aria-label={ariaLabel}
        className={cn(
          "border-input text-foreground hover:bg-accent flex size-7 shrink-0 items-center justify-center rounded-full border transition",
          desabilitado && "cursor-not-allowed opacity-40",
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        Mostrando {inicio.toLocaleString("pt-BR")}-{fim.toLocaleString("pt-BR")} de{" "}
        {total.toLocaleString("pt-BR")} agências
      </span>
      <div className="flex items-center gap-1.5">
        <Botao destino={1} ariaLabel="Primeira página">
          <ChevronsLeft className="size-4" />
        </Botao>
        <Botao destino={pagina - 1} ariaLabel="Página anterior">
          <ChevronLeft className="size-4" />
        </Botao>
        <span className="text-muted-foreground px-2 text-xs whitespace-nowrap">
          Página {pagina} de {totalPaginas}
        </span>
        <Botao destino={pagina + 1} ariaLabel="Próxima página">
          <ChevronRight className="size-4" />
        </Botao>
        <Botao destino={totalPaginas} ariaLabel="Última página">
          <ChevronsRight className="size-4" />
        </Botao>
      </div>
    </div>
  );
}
