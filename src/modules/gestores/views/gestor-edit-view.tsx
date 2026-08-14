"use client";

import Link from "next/link";
import { useUpdateGestorViewModel } from "@/modules/gestores/view-models/use-update-gestor.view-model";
import { GestorForm } from "@/modules/gestores/components/gestor-form";
import { GestorSuccess } from "@/modules/gestores/components/gestor-success";
import type { BaseView } from "@/modules/bases/types/base.types";

interface GestorEditViewProps {
  id: string;
  basesOptions: BaseView[];
}

export function GestorEditView({ id, basesOptions }: GestorEditViewProps) {
  const { gestor, isLoading, loadError, isSubmitting, submitError, submit, result, dismissResult } =
    useUpdateGestorViewModel(id);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-xl font-semibold">Editar gestor</h1>
        <Link
          href="/gestores"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          ← Voltar pra Gestores
        </Link>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : null}
      {loadError ? <p className="text-destructive text-sm">{loadError}</p> : null}

      {result ? <GestorSuccess result={result} onDismiss={dismissResult} /> : null}

      {gestor ? (
        <GestorForm
          isSubmitting={isSubmitting}
          error={submitError}
          onSubmit={submit}
          gestorAtual={gestor}
          submitLabel="Salvar alterações"
          basesOptions={basesOptions}
        />
      ) : null}
    </div>
  );
}
