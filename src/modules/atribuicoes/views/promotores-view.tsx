"use client";

import { useState } from "react";
import { useExecutivosListaViewModel } from "@/modules/atribuicoes/view-models/use-executivos-lista.view-model";
import { ExecutivosListaToolbar } from "@/modules/atribuicoes/components/executivos-lista-toolbar";
import { ExecutivosListaTabela } from "@/modules/atribuicoes/components/executivos-lista-tabela";
import { ExecutivoEdicaoModal } from "@/modules/atribuicoes/components/executivo-edicao-modal";
import { ExecutivoCadastroModal } from "@/modules/atribuicoes/components/executivo-cadastro-modal";
import { PaginacaoSimples } from "@/modules/shared/components/paginacao-simples";
import { TAMANHO_PAGINA_EXECUTIVOS } from "@/modules/atribuicoes/types/promotor-lista.types";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";
import type { BaseView } from "@/modules/bases/types/base.types";

interface PromotoresViewProps {
  gestoresOptions: GestorOpcao[];
  // Opções pro seletor "Gestor" do modal de cadastro — null quando o
  // usuário logado é Gestor (não escolhe, o vínculo já é o dele). Distinto
  // de `gestoresOptions` acima, que é sempre a lista cheia (usada só pra
  // exibir o nome do gestor na coluna da tabela). Ver page.tsx.
  criacaoGestoresOptions: GestorOpcao[] | null;
  minhasBasesSiglas?: string[];
  todasBases: BaseView[];
}

export function PromotoresView({
  gestoresOptions,
  criacaoGestoresOptions,
  minhasBasesSiglas,
  todasBases,
}: PromotoresViewProps) {
  const [modalAberto, setModalAberto] = useState(false);
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
        onNovoCadastro={() => setModalAberto(true)}
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

      <ExecutivoCadastroModal
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        gestoresOptions={criacaoGestoresOptions}
        minhasBasesSiglas={minhasBasesSiglas}
        todasBases={todasBases}
      />
    </div>
  );
}
