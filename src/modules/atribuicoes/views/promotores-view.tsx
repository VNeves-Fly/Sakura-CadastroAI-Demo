"use client";

import { useState } from "react";
import { useExecutivosListaViewModel } from "@/modules/atribuicoes/view-models/use-executivos-lista.view-model";
import { ExecutivosListaToolbar } from "@/modules/atribuicoes/components/executivos-lista-toolbar";
import { ExecutivosListaTabela } from "@/modules/atribuicoes/components/executivos-lista-tabela";
import { ExecutivoEdicaoModal } from "@/modules/atribuicoes/components/executivo-edicao-modal";
import { PaginacaoSimples } from "@/modules/shared/components/paginacao-simples";
import { TAMANHO_PAGINA_EXECUTIVOS } from "@/modules/atribuicoes/types/promotor-lista.types";
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
    <div className="flex w-full flex-col gap-[18px]">
      <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#1A1A2E]">Executivos</h1>

      <ExecutivosListaToolbar
        busca={filtros.busca}
        onBuscaChange={(valor) => atualizarFiltro("busca", valor)}
      />

      <div>
        <ExecutivosListaTabela
          executivos={executivos}
          isLoading={isLoading}
          error={error}
          onEditar={setPromotorEmEdicaoId}
        />

        {!isLoading && !error ? (
          <PaginacaoSimples
            pagina={pagina}
            totalPaginas={totalPaginas}
            total={total}
            tamanhoPagina={TAMANHO_PAGINA_EXECUTIVOS}
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
