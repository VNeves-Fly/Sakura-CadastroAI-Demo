"use client";

import { useAssociacoesListViewModel } from "@/modules/associacoes/view-models/use-associacoes-list.view-model";
import { useCreateAssociacaoViewModel } from "@/modules/associacoes/view-models/use-create-associacao.view-model";
import { AssociacaoForm } from "@/modules/associacoes/components/associacao-form";
import { AssociacaoList } from "@/modules/associacoes/components/associacao-list";

export function AssociacoesView() {
  const { associacoes, isLoading, error } = useAssociacoesListViewModel();
  const { isSubmitting, error: createError, submit } = useCreateAssociacaoViewModel();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-foreground text-xl font-semibold">Associações</h1>
      <AssociacaoForm isSubmitting={isSubmitting} error={createError} onSubmit={submit} />
      <AssociacaoList associacoes={associacoes} isLoading={isLoading} error={error} />
    </div>
  );
}
