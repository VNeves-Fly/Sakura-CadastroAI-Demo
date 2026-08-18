"use client";

import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TAMANHO_PAGINA_AGENCIAS } from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasPaginacaoProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  onMudarPagina: (pagina: number) => void;
}

// Rodapé de paginação (SPEC seção 3.6) — client-side (a carteira inteira
// já está em memória, mesmo padrão usado no resto do app pra esse volume
// de dado; ver observação de escala no adapter/loader deste módulo).
export function AgenciasPaginacao({
  pagina,
  totalPaginas,
  total,
  onMudarPagina,
}: AgenciasPaginacaoProps) {
  const inicio = total === 0 ? 0 : (pagina - 1) * TAMANHO_PAGINA_AGENCIAS + 1;
  const fim = Math.min(pagina * TAMANHO_PAGINA_AGENCIAS, total);

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
    <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <p className="text-muted-foreground text-xs">
        {inicio.toLocaleString("pt-BR")}-{fim.toLocaleString("pt-BR")} de{" "}
        {total.toLocaleString("pt-BR")}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground mr-1 text-xs whitespace-nowrap">
          Pág. {pagina} de {totalPaginas}
        </span>
        <Botao destino={1} ariaLabel="Primeira página">
          <ChevronsLeft className="size-4" />
        </Botao>
        <Botao destino={pagina - 1} ariaLabel="Página anterior">
          <ChevronLeft className="size-4" />
        </Botao>
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
