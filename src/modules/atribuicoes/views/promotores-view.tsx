"use client";

import { useExecutivosListaViewModel } from "@/modules/atribuicoes/view-models/use-executivos-lista.view-model";
import { ExecutivosListaToolbar } from "@/modules/atribuicoes/components/executivos-lista-toolbar";
import { ExecutivosListaTabela } from "@/modules/atribuicoes/components/executivos-lista-tabela";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";

interface PromotoresViewProps {
  gestoresOptions: GestorOpcao[];
}

export function PromotoresView({ gestoresOptions }: PromotoresViewProps) {
  const { executivos, total, isLoading, error, filtros, atualizarFiltro } =
    useExecutivosListaViewModel(gestoresOptions);

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-foreground text-xl font-semibold">Executivos</h1>

      <ExecutivosListaToolbar filtros={filtros} onAtualizarFiltro={atualizarFiltro} total={total} />

      <ExecutivosListaTabela executivos={executivos} isLoading={isLoading} error={error} />
    </div>
  );
}
