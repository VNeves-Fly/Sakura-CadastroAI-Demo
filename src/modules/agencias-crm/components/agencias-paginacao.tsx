"use client";

import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TAMANHOS_PAGINA_AGENCIAS_PERMITIDOS } from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasPaginacaoProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  onMudarPagina: (pagina: number) => void;
  tamanhoPagina: number;
  onMudarTamanhoPagina: (tamanho: number) => void;
}

// Rodapé de paginação (SPEC seção 3.6) — client-side (a carteira inteira
// já está em memória, mesmo padrão usado no resto do app pra esse volume
// de dado; ver observação de escala no adapter/loader deste módulo).
// Tamanho de página configurável aqui (não via querystring, como
// SeletorTamanhoPagina de /cadastros) — não há paginação real no
// servidor pra essa listagem, é só um corte do array em memória.
export function AgenciasPaginacao({
  pagina,
  totalPaginas,
  total,
  onMudarPagina,
  tamanhoPagina,
  onMudarTamanhoPagina,
}: AgenciasPaginacaoProps) {
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
          "flex size-7 shrink-0 items-center justify-center rounded-full border border-[#E2E2EE] text-[#3A3A55] transition hover:bg-[#FAFAFD]",
          desabilitado && "cursor-not-allowed text-[#C9C9DA] opacity-70 hover:bg-transparent",
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] py-3.5">
      <div className="flex items-center gap-2">
        <p className="text-xs text-[#8888AA]">
          {inicio.toLocaleString("pt-BR")}-{fim.toLocaleString("pt-BR")} de{" "}
          {total.toLocaleString("pt-BR")}
        </p>
        <Select
          value={String(tamanhoPagina)}
          onValueChange={(valor) => onMudarTamanhoPagina(Number(valor))}
        >
          <SelectTrigger
            id="agencias-tamanho-pagina"
            aria-label="Agências por página"
            className="w-auto gap-1 rounded-full border-[#E2E2EE] px-3 py-1.5 text-xs text-[#3A3A55]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAMANHOS_PAGINA_AGENCIAS_PERMITIDOS.map((tamanho) => (
              <SelectItem key={tamanho} value={String(tamanho)}>
                {tamanho} por página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-xs whitespace-nowrap text-[#8888AA]">
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
