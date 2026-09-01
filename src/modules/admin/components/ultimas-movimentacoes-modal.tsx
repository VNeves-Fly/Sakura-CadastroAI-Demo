"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MovimentacaoItemRow } from "@/modules/admin/components/movimentacao-item-row";
import { listarUltimasMovimentacoesEtapaAction } from "@/app/(admin)/cadastros/dashboard/actions";
import type { HistoricoEtapaCadastroItem } from "@/modules/cadastro/domain/repositories/agencia-repository";

const TAMANHO_PAGINA = 20;

interface UltimasMovimentacoesModalProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
}

// Histórico completo do feed de movimentações, paginado — a tela principal
// (UltimasMovimentacoesList) só mostra os 5 mais recentes; este modal
// busca o restante sob demanda via listarUltimasMovimentacoesEtapaAction.
export function UltimasMovimentacoesModal({
  aberto,
  onOpenChange,
}: UltimasMovimentacoesModalProps) {
  const [pagina, setPagina] = useState(1);
  const [itens, setItens] = useState<HistoricoEtapaCadastroItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pendente, startTransition] = useTransition();

  useEffect(() => {
    if (!aberto) return;
    startTransition(async () => {
      const resultado = await listarUltimasMovimentacoesEtapaAction(pagina);
      setItens(resultado.items);
      setTotal(resultado.total);
    });
  }, [aberto, pagina]);

  function aoMudarAberto(novoAberto: boolean) {
    onOpenChange(novoAberto);
    // Reseta pra próxima abertura sempre começar do início.
    if (!novoAberto) setPagina(1);
  }

  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Últimas movimentações</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {itens.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {pendente ? "Carregando…" : "Nenhuma movimentação ainda."}
            </p>
          ) : (
            <ul
              className={`divide-border flex flex-col divide-y transition-opacity ${
                pendente ? "opacity-50" : ""
              }`}
            >
              {itens.map((item) => (
                <MovimentacaoItemRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>

        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-muted-foreground text-xs">{total} movimentação(ões) encontrada(s)</p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1 || pendente}
              aria-label="Página anterior"
              className={`border-input rounded-full border p-1.5 transition ${
                pagina === 1 ? "pointer-events-none opacity-40" : "hover:bg-accent"
              }`}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas || pendente}
              aria-label="Próxima página"
              className={`border-input rounded-full border p-1.5 transition ${
                pagina === totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-accent"
              }`}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
