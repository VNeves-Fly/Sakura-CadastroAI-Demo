"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCarregamentoInfinito } from "@/modules/dashboard-vendas/hooks/use-carregamento-infinito";
import { LogoFornecedor } from "@/modules/dashboard-vendas/components/top-fornecedores-card";
import {
  formatarMoedaAbreviada,
  formatarNumero,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import type { TopFornecedor } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface TopFornecedoresDetalheModalProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  itens: TopFornecedor[];
}

// Ranking completo (4.10) — scroll infinito de 20 em 20, sempre na
// mesma ordem de classificação (a busca só filtra, nunca reordena).
export function TopFornecedoresDetalheModal({
  aberto,
  onOpenChange,
  titulo,
  itens,
}: TopFornecedoresDetalheModalProps) {
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
            {formatarNumero(itensFiltrados.length)} fornecedor(es)
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
            {itensVisiveis.map((fornecedor, indice) => (
              <li
                key={fornecedor.nome}
                className="border-border flex items-center gap-3 border-b pb-2.5 last:border-0"
              >
                <span className="text-muted-foreground w-8 shrink-0 text-xs font-bold">
                  {indice + 1}
                </span>
                <LogoFornecedor nome={fornecedor.nome} />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{fornecedor.nome}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatarNumero(fornecedor.qtdBilhetes)} bilhetes · AÉREO
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-foreground text-sm font-bold">
                    {formatarMoedaAbreviada(fornecedor.valor)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatarPercentual(fornecedor.participacaoPct)}
                  </p>
                </div>
              </li>
            ))}
            {itensVisiveis.length === 0 ? (
              <li className="text-muted-foreground py-10 text-center text-sm">
                Nenhum fornecedor encontrado.
              </li>
            ) : null}
          </ul>

          {temMais ? (
            <div ref={sentinelaRef} className="text-muted-foreground py-4 text-center text-xs">
              Carregando mais fornecedores...
            </div>
          ) : itensVisiveis.length > 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs">Fim da lista.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
