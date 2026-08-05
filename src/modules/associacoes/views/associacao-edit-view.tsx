"use client";

import Link from "next/link";
import { useUpdateAssociacaoViewModel } from "@/modules/associacoes/view-models/use-update-associacao.view-model";
import { AssociacaoForm } from "@/modules/associacoes/components/associacao-form";

interface AssociacaoEditViewProps {
  id: string;
}

export function AssociacaoEditView({ id }: AssociacaoEditViewProps) {
  const { associacao, isLoading, loadError, isSubmitting, submitError, submit } =
    useUpdateAssociacaoViewModel(id);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-xl font-semibold">Editar associação</h1>
        <Link
          href="/associacoes"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          ← Voltar pra Associações
        </Link>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : null}
      {loadError ? <p className="text-destructive text-sm">{loadError}</p> : null}

      {associacao ? (
        <AssociacaoForm
          isSubmitting={isSubmitting}
          error={submitError}
          onSubmit={submit}
          associacaoAtual={associacao}
          submitLabel="Salvar alterações"
        />
      ) : null}
    </div>
  );
}
