"use client";

import { useState } from "react";
import { useGestoresListaViewModel } from "@/modules/gestores/view-models/use-gestores-lista.view-model";
import { GestoresListaToolbar } from "@/modules/gestores/components/gestores-lista-toolbar";
import { GestoresListaTabela } from "@/modules/gestores/components/gestores-lista-tabela";
import { GestorCadastroModal } from "@/modules/gestores/components/gestor-cadastro-modal";
import { GestorEdicaoModal } from "@/modules/gestores/components/gestor-edicao-modal";
import { PaginacaoSimples } from "@/modules/shared/components/paginacao-simples";
import { TAMANHO_PAGINA_GESTORES } from "@/modules/gestores/types/gestor-lista.types";
import type { BaseView } from "@/modules/bases/types/base.types";

interface GestoresViewProps {
  basesOptions: BaseView[];
  // Real: contagem de Promotor.gestorId por gestor, calculada em page.tsx.
  executivosPorGestor: Record<string, number>;
  // Real: soma das vendas SST dos executivos subordinados, ver page.tsx.
  vendasPorGestor: Record<string, { vendasMes: number; vendasAno: number }>;
}

export function GestoresView({
  basesOptions,
  executivosPorGestor,
  vendasPorGestor,
}: GestoresViewProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [gestorEmEdicaoId, setGestorEmEdicaoId] = useState<string | null>(null);
  const { gestores, total, isLoading, error, busca, atualizarBusca } = useGestoresListaViewModel(
    executivosPorGestor,
    vendasPorGestor,
  );

  const gestorEmEdicao = gestores.find((gestor) => gestor.id === gestorEmEdicaoId);

  return (
    <div className="flex w-full flex-col gap-[18px]">
      <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#1A1A2E]">Gestores</h1>

      <GestoresListaToolbar
        busca={busca}
        onBuscaChange={atualizarBusca}
        onNovoCadastro={() => setModalAberto(true)}
      />

      <div>
        <GestoresListaTabela
          gestores={gestores}
          isLoading={isLoading}
          error={error}
          onEditar={setGestorEmEdicaoId}
        />

        {!isLoading && !error ? (
          <PaginacaoSimples
            pagina={pagina}
            totalPaginas={totalPaginas}
            total={total}
            tamanhoPagina={TAMANHO_PAGINA_GESTORES}
            onMudarPagina={setPagina}
          />
        ) : null}
      </div>

      <GestorCadastroModal
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        basesOptions={basesOptions}
      />

      <GestorEdicaoModal
        gestorId={gestorEmEdicaoId}
        executivosCount={gestorEmEdicao?.executivos ?? 0}
        onOpenChange={(aberto) => setGestorEmEdicaoId(aberto ? gestorEmEdicaoId : null)}
        basesOptions={basesOptions}
      />
    </div>
  );
}
