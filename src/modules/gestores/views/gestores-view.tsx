"use client";

import { useState } from "react";
import { useGestoresListaViewModel } from "@/modules/gestores/view-models/use-gestores-lista.view-model";
import { GestoresListaToolbar } from "@/modules/gestores/components/gestores-lista-toolbar";
import { GestoresListaTabela } from "@/modules/gestores/components/gestores-lista-tabela";
import { GestorCadastroModal } from "@/modules/gestores/components/gestor-cadastro-modal";
import { PaginacaoSimples } from "@/modules/shared/components/paginacao-simples";
import { TAMANHO_PAGINA_GESTORES } from "@/modules/gestores/types/gestor-lista.types";
import type { RawGestorResponse } from "@/modules/gestores/services/gestores.service";
import type { BaseView } from "@/modules/bases/types/base.types";

interface GestoresViewProps {
  basesOptions: BaseView[];
  // Real: contagem de Promotor.gestorId por gestor, calculada em page.tsx.
  executivosPorGestor: Record<string, number>;
  // Real: soma das vendas SST dos executivos subordinados, ver page.tsx.
  vendasPorGestor: Record<string, { vendasMes: number; vendasAno: number }>;
  // Já vem do banco local (SSR, ver page.tsx) — quando presente, semeia a
  // store e evita o fetch client redundante a /api/gestores no mount.
  initialGestores?: RawGestorResponse[];
}

export function GestoresView({
  basesOptions,
  executivosPorGestor,
  vendasPorGestor,
  initialGestores,
}: GestoresViewProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [gestorEmEdicaoId, setGestorEmEdicaoId] = useState<string | null>(null);
  const {
    gestores,
    total,
    isLoading,
    error,
    busca,
    atualizarBusca,
    pagina,
    totalPaginas,
    setPagina,
  } = useGestoresListaViewModel(executivosPorGestor, vendasPorGestor, initialGestores);

  // Um único modal (GestorCadastroModal) atende Novo e Editar — abre em
  // branco quando modalAberto, ou pré-preenchido quando gestorEmEdicaoId
  // existe (pedido do usuário, 2026-08-26). onOpenChange(false) zera os dois
  // estados de uma vez, já que só um fica ativo por vez.
  function fecharModal(aberto: boolean) {
    if (aberto) {
      setModalAberto(true);
      return;
    }
    setModalAberto(false);
    setGestorEmEdicaoId(null);
  }

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
        gestorId={gestorEmEdicaoId}
        onOpenChange={fecharModal}
        basesOptions={basesOptions}
      />
    </div>
  );
}
