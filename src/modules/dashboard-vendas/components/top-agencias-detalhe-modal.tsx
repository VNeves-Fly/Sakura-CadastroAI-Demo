"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCarregamentoInfinito } from "@/modules/dashboard-vendas/hooks/use-carregamento-infinito";
import { ICONE_CANAL, COR_CANAL } from "@/modules/dashboard-vendas/components/top-agencias-card";
import {
  formatarMoedaAbreviada,
  formatarNumero,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import type { TopAgencia } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface TopAgenciasDetalheModalProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  itens: TopAgencia[];
}

// Ranking completo (4.10) — scroll infinito de 20 em 20, sempre na
// mesma ordem de classificação (a busca só filtra, nunca reordena).
export function TopAgenciasDetalheModal({
  aberto,
  onOpenChange,
  titulo,
  itens,
}: TopAgenciasDetalheModalProps) {
  const [busca, setBusca] = useState("");

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter((item) => item.nome.toLowerCase().includes(termo));
  }, [itens, busca]);

  const { itensVisiveis, scrollRef, sentinelaRef, temMais } =
    useCarregamentoInfinito(itensFiltrados);

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        onOpenChange(valor);
        if (!valor) setBusca("");
      }}
    >
      <DialogContent className="dashboard-vendas-scope max-w-2xl">
        <DialogHeader className="flex-row items-baseline gap-2 space-y-0">
          <DialogTitle>{titulo}</DialogTitle>
          <span className="text-muted-foreground text-sm">
            {formatarNumero(itensFiltrados.length)} agência(s)
          </span>
        </DialogHeader>

        <div className="p-4 pb-3">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Pesquisar por nome..."
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border py-2.5 pr-4 pl-10 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
          <ul className="flex flex-col gap-2.5">
            {itensVisiveis.map((agencia) => {
              const Icone = ICONE_CANAL[agencia.canal];
              return (
                <li
                  key={agencia.posicao}
                  className="border-border flex items-center gap-3 border-b pb-2.5 last:border-0"
                >
                  <span className="text-muted-foreground w-8 shrink-0 text-xs font-bold">
                    {agencia.posicao}
                  </span>
                  <Icone
                    className="size-3.5 shrink-0"
                    style={{ color: COR_CANAL[agencia.canal] }}
                  />
                  <p className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                    {agencia.nome}
                  </p>
                  <div className="shrink-0 text-right">
                    <p className="text-foreground text-sm font-bold">
                      {formatarMoedaAbreviada(agencia.valor)}
                    </p>
                    <p className="text-muted-foreground text-xs">{formatarNumero(agencia.qtd)}</p>
                  </div>
                </li>
              );
            })}
            {itensVisiveis.length === 0 ? (
              <li className="text-muted-foreground py-10 text-center text-sm">
                Nenhuma agência encontrada.
              </li>
            ) : null}
          </ul>

          {temMais ? (
            <div ref={sentinelaRef} className="text-muted-foreground py-4 text-center text-xs">
              Carregando mais agências...
            </div>
          ) : itensVisiveis.length > 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs">Fim da lista.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
