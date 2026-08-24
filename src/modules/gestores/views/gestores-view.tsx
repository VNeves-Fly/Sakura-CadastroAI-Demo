"use client";

import { useState } from "react";
import { useGestoresListaViewModel } from "@/modules/gestores/view-models/use-gestores-lista.view-model";
import { GestoresListaToolbar } from "@/modules/gestores/components/gestores-lista-toolbar";
import { GestoresListaTabela } from "@/modules/gestores/components/gestores-lista-tabela";
import { GestorCadastroModal } from "@/modules/gestores/components/gestor-cadastro-modal";
import { GestorEdicaoModal } from "@/modules/gestores/components/gestor-edicao-modal";
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
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-foreground text-xl font-semibold">Gestores</h1>

      <GestoresListaToolbar
        busca={busca}
        onBuscaChange={atualizarBusca}
        total={total}
        onNovoCadastro={() => setModalAberto(true)}
      />

      <GestoresListaTabela
        gestores={gestores}
        isLoading={isLoading}
        error={error}
        onEditar={setGestorEmEdicaoId}
      />

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
