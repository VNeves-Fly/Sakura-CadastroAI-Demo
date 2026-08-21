"use client";

import { useState } from "react";
import { useExecutivosListaViewModel } from "@/modules/atribuicoes/view-models/use-executivos-lista.view-model";
import { ExecutivosListaToolbar } from "@/modules/atribuicoes/components/executivos-lista-toolbar";
import { ExecutivosListaTabela } from "@/modules/atribuicoes/components/executivos-lista-tabela";
import { ExecutivosPaginacao } from "@/modules/atribuicoes/components/executivos-paginacao";
import { ExecutivoEdicaoModal } from "@/modules/atribuicoes/components/executivo-edicao-modal";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";
import type { BaseView } from "@/modules/bases/types/base.types";

interface PromotoresViewProps {
  gestoresOptions: GestorOpcao[];
  todasBases: BaseView[];
}

export function PromotoresView({ gestoresOptions, todasBases }: PromotoresViewProps) {
  const [promotorEmEdicaoId, setPromotorEmEdicaoId] = useState<string | null>(null);
  const {
    executivos,
    total,
    isLoading,
    error,
    filtros,
    atualizarFiltro,
    pagina,
    totalPaginas,
    setPagina,
  } = useExecutivosListaViewModel(gestoresOptions);

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-foreground text-xl font-semibold">Executivos</h1>

      <ExecutivosListaToolbar filtros={filtros} onAtualizarFiltro={atualizarFiltro} total={total} />

      {/* Mesmo wrapper de card de AgenciasListaView — tabela + paginação
          dentro da mesma borda, paginação em fluxo normal (não fixa). */}
      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <ExecutivosListaTabela
          executivos={executivos}
          isLoading={isLoading}
          error={error}
          onEditar={setPromotorEmEdicaoId}
        />

        {!isLoading && !error ? (
          <ExecutivosPaginacao
            pagina={pagina}
            totalPaginas={totalPaginas}
            total={total}
            onMudarPagina={setPagina}
          />
        ) : null}
      </div>

      <ExecutivoEdicaoModal
        promotorId={promotorEmEdicaoId}
        onOpenChange={(aberto) => setPromotorEmEdicaoId(aberto ? promotorEmEdicaoId : null)}
        todasBases={todasBases}
      />
    </div>
  );
}
