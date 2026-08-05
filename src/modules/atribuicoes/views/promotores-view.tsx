"use client";

import { usePromotoresListViewModel } from "@/modules/atribuicoes/view-models/use-promotores-list.view-model";
import { useCreatePromotorViewModel } from "@/modules/atribuicoes/view-models/use-create-promotor.view-model";
import { PromotorForm } from "@/modules/atribuicoes/components/promotor-form";
import { PromotorCrudList } from "@/modules/atribuicoes/components/promotor-crud-list";
import { PromotorSuccess } from "@/modules/atribuicoes/components/promotor-success";
import type { BaseView } from "@/modules/bases/types/base.types";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";

interface PromotoresViewProps {
  gestoresOptions: GestorOpcao[] | null;
  minhasBasesSiglas?: string[];
  todasBases: BaseView[];
}

export function PromotoresView({
  gestoresOptions,
  minhasBasesSiglas,
  todasBases,
}: PromotoresViewProps) {
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
        minhasBasesSiglas={minhasBasesSiglas}
        todasBases={todasBases}
      />
      <PromotorCrudList promotores={promotores} isLoading={isLoading} error={error} />
    </div>
  );
}
