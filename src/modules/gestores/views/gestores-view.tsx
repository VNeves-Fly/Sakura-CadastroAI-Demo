"use client";

import { useState } from "react";
import { useGestoresListaViewModel } from "@/modules/gestores/view-models/use-gestores-lista.view-model";
import { GestoresListaToolbar } from "@/modules/gestores/components/gestores-lista-toolbar";
import { GestoresListaTabela } from "@/modules/gestores/components/gestores-lista-tabela";
import { GestorCadastroModal } from "@/modules/gestores/components/gestor-cadastro-modal";
import type { BaseView } from "@/modules/bases/types/base.types";

interface GestoresViewProps {
  basesOptions: BaseView[];
  // Real: contagem de Promotor.gestorId por gestor, calculada em page.tsx.
  executivosPorGestor: Record<string, number>;
}

export function GestoresView({ basesOptions, executivosPorGestor }: GestoresViewProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const { gestores, total, isLoading, error, busca, atualizarBusca } =
    useGestoresListaViewModel(executivosPorGestor);

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-foreground text-xl font-semibold">Gestores</h1>

      <GestoresListaToolbar
        busca={busca}
        onBuscaChange={atualizarBusca}
        total={total}
        onNovoCadastro={() => setModalAberto(true)}
      />

      <GestoresListaTabela gestores={gestores} isLoading={isLoading} error={error} />

      <GestorCadastroModal
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        basesOptions={basesOptions}
      />
    </div>
  );
}
