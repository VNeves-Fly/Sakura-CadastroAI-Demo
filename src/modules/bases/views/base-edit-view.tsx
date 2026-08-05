"use client";

import Link from "next/link";
import { useUpdateBaseViewModel } from "@/modules/bases/view-models/use-update-base.view-model";
import { BaseForm } from "@/modules/bases/components/base-form";

interface BaseEditViewProps {
  id: string;
}

export function BaseEditView({ id }: BaseEditViewProps) {
  const { base, isLoading, loadError, isSubmitting, submitError, submit } =
    useUpdateBaseViewModel(id);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-xl font-semibold">Editar base</h1>
        <Link
          href="/bases"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          ← Voltar pra Bases
        </Link>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : null}
      {loadError ? <p className="text-destructive text-sm">{loadError}</p> : null}

      {base ? (
        <BaseForm
          isSubmitting={isSubmitting}
          error={submitError}
          onSubmit={submit}
          baseAtual={base}
          submitLabel="Salvar alterações"
        />
      ) : null}
    </div>
  );
}
