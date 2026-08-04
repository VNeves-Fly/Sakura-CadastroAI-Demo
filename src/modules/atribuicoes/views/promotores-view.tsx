"use client";

import { usePromotoresListViewModel } from "@/modules/atribuicoes/view-models/use-promotores-list.view-model";
import { useCreatePromotorViewModel } from "@/modules/atribuicoes/view-models/use-create-promotor.view-model";
import { PromotorForm } from "@/modules/atribuicoes/components/promotor-form";
import { PromotorCrudList } from "@/modules/atribuicoes/components/promotor-crud-list";
import { PromotorSuccess } from "@/modules/atribuicoes/components/promotor-success";

interface PromotoresViewProps {
  gestoresOptions: Array<{ id: string; nome: string }> | null;
}

export function PromotoresView({ gestoresOptions }: PromotoresViewProps) {
  const { promotores, isLoading, error } = usePromotoresListViewModel();
  const {
    isSubmitting,
    error: createError,
    submit,
    lastCreatedResult,
    dismissSuccess,
  } = useCreatePromotorViewModel();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-foreground text-xl font-semibold">Executivos</h1>

      {lastCreatedResult ? (
        <PromotorSuccess result={lastCreatedResult} onDismiss={dismissSuccess} />
      ) : null}

      <PromotorForm
        isSubmitting={isSubmitting}
        error={createError}
        onSubmit={submit}
        gestoresOptions={gestoresOptions}
      />
      <PromotorCrudList promotores={promotores} isLoading={isLoading} error={error} />
    </div>
  );
}
