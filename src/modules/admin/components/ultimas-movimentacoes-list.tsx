"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HistoricoEtapaCadastroItem } from "@/modules/cadastro/domain/repositories/agencia-repository";
import { MovimentacaoItemRow } from "@/modules/admin/components/movimentacao-item-row";
import { UltimasMovimentacoesModal } from "@/modules/admin/components/ultimas-movimentacoes-modal";

interface UltimasMovimentacoesListProps {
  itens: HistoricoEtapaCadastroItem[];
}

// Feed cronológico das últimas transições de etapa (ver
// HistoricoEtapaCadastro/listarUltimasMovimentacoesEtapa) — quem/o que
// causou cada mudança e quando, cruzando todas as agências. Só os 5 mais
// recentes ficam na tela principal (ver LIMITE_ULTIMAS_MOVIMENTACOES em
// obter-metricas-dashboard.use-case.ts); "Ver mais" abre o histórico
// completo, paginado (ver UltimasMovimentacoesModal).
export function UltimasMovimentacoesList({ itens }: UltimasMovimentacoesListProps) {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Últimas movimentações
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setModalAberto(true)}>
          Ver mais
        </Button>
      </div>
      {itens.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">Nenhuma movimentação ainda.</p>
      ) : (
        <ul className="divide-border mt-1 flex flex-col divide-y">
          {itens.map((item) => (
            <MovimentacaoItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
      <UltimasMovimentacoesModal aberto={modalAberto} onOpenChange={setModalAberto} />
    </div>
  );
}
