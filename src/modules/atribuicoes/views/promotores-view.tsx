"use client";

import { useState } from "react";
import { useExecutivosListaViewModel } from "@/modules/atribuicoes/view-models/use-executivos-lista.view-model";
import { ExecutivosListaToolbar } from "@/modules/atribuicoes/components/executivos-lista-toolbar";
import { ExecutivosListaTabela } from "@/modules/atribuicoes/components/executivos-lista-tabela";
import { ExecutivoEdicaoModal } from "@/modules/atribuicoes/components/executivo-edicao-modal";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";
import type { BaseView } from "@/modules/bases/types/base.types";

interface PromotoresViewProps {
  gestoresOptions: GestorOpcao[];
  todasBases: BaseView[];
}

export function PromotoresView({ gestoresOptions, todasBases }: PromotoresViewProps) {
  const [promotorEmEdicaoId, setPromotorEmEdicaoId] = useState<string | null>(null);
  const { executivos, total, isLoading, error, filtros, atualizarFiltro, alternarAtivo } =
    useExecutivosListaViewModel(gestoresOptions);

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-foreground text-xl font-semibold">Executivos</h1>

      <ExecutivosListaToolbar filtros={filtros} onAtualizarFiltro={atualizarFiltro} total={total} />

      <ExecutivosListaTabela
        executivos={executivos}
        isLoading={isLoading}
        error={error}
        onEditar={setPromotorEmEdicaoId}
        onAlternarAtivo={alternarAtivo}
      />

      <ExecutivoEdicaoModal
        promotorId={promotorEmEdicaoId}
        onOpenChange={(aberto) => setPromotorEmEdicaoId(aberto ? promotorEmEdicaoId : null)}
        todasBases={todasBases}
      />
    </div>
  );
}
