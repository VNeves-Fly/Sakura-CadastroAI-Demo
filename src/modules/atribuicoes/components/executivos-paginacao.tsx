"use client";

import type { ReactNode } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TAMANHO_PAGINA_EXECUTIVOS } from "@/modules/atribuicoes/types/promotor-lista.types";

interface ExecutivosPaginacaoProps {
  pagina: number;
  totalPaginas: number;
  total: number;
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
        "border-input text-foreground hover:bg-accent flex size-7 shrink-0 items-center justify-center rounded-full border transition",
        desabilitado && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

// Rodapé de paginação da lista de Executivos, 25 por página (pedido do
// usuário, 2026-08-19) — mesmo modelo (estático, dentro do card, sem
// position:fixed) de AgenciasPaginacao (agencias-crm), reproduzido aqui
// pra não furar o isolamento entre módulos. A tentativa anterior de
// deixar isso fixo no rodapé da viewport entrou em conflito com a barra
// de rolagem horizontal da tabela (duas barras competindo pelo mesmo
// espaço) — voltamos pro modelo simples que já funciona em Agências.
export function ExecutivosPaginacao({
  pagina,
  totalPaginas,
  total,
  onMudarPagina,
}: ExecutivosPaginacaoProps) {
  const inicio = total === 0 ? 0 : (pagina - 1) * TAMANHO_PAGINA_EXECUTIVOS + 1;
  const fim = Math.min(pagina * TAMANHO_PAGINA_EXECUTIVOS, total);

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
        <Botao
          destino={1}
          pagina={pagina}
          totalPaginas={totalPaginas}
          ariaLabel="Primeira página"
          onMudarPagina={onMudarPagina}
        >
          <ChevronsLeft className="size-4" />
        </Botao>
        <Botao
          destino={pagina - 1}
          pagina={pagina}
          totalPaginas={totalPaginas}
          ariaLabel="Página anterior"
          onMudarPagina={onMudarPagina}
        >
          <ChevronLeft className="size-4" />
        </Botao>
        <Botao
          destino={pagina + 1}
          pagina={pagina}
          totalPaginas={totalPaginas}
          ariaLabel="Próxima página"
          onMudarPagina={onMudarPagina}
        >
          <ChevronRight className="size-4" />
        </Botao>
        <Botao
          destino={totalPaginas}
          pagina={pagina}
          totalPaginas={totalPaginas}
          ariaLabel="Última página"
          onMudarPagina={onMudarPagina}
        >
          <ChevronsRight className="size-4" />
        </Botao>
      </div>
    </div>
  );
}
