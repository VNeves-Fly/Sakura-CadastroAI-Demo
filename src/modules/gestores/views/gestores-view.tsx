"use client";

import { useGestoresListViewModel } from "@/modules/gestores/view-models/use-gestores-list.view-model";
import { useCreateGestorViewModel } from "@/modules/gestores/view-models/use-create-gestor.view-model";
import { GestorForm } from "@/modules/gestores/components/gestor-form";
import { GestorList } from "@/modules/gestores/components/gestor-list";
import { GestorSuccess } from "@/modules/gestores/components/gestor-success";

export function GestoresView() {
  const { gestores, isLoading, error } = useGestoresListViewModel();
  const {
    isSubmitting,
    error: createError,
    submit,
    lastCreatedResult,
    dismissSuccess,
  } = useCreateGestorViewModel();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-foreground text-xl font-semibold">Gestores</h1>

      {lastCreatedResult ? (
        <GestorSuccess result={lastCreatedResult} onDismiss={dismissSuccess} />
      ) : null}

      <GestorForm isSubmitting={isSubmitting} error={createError} onSubmit={submit} />
      <GestorList gestores={gestores} isLoading={isLoading} error={error} />
    </div>
  );
}
