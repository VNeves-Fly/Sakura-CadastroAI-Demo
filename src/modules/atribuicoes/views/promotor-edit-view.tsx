"use client";

import Link from "next/link";
import { useUpdatePromotorViewModel } from "@/modules/atribuicoes/view-models/use-update-promotor.view-model";
import { PromotorForm } from "@/modules/atribuicoes/components/promotor-form";
import { PromotorSuccess } from "@/modules/atribuicoes/components/promotor-success";
import type { BaseView } from "@/modules/bases/types/base.types";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";

interface PromotorEditViewProps {
  id: string;
  gestoresOptions: GestorOpcao[] | null;
  minhasBasesSiglas?: string[];
  todasBases: BaseView[];
}

export function PromotorEditView({
  id,
  gestoresOptions,
  minhasBasesSiglas,
  todasBases,
}: PromotorEditViewProps) {
  const {
    promotor,
    isLoading,
    loadError,
    isSubmitting,
    submitError,
    submit,
    result,
    dismissResult,
  } = useUpdatePromotorViewModel(id);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-xl font-semibold">Editar executivo</h1>
        <Link
          href={`/executivos/${id}`}
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          ← Voltar pro perfil do executivo
        </Link>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : null}
      {loadError ? <p className="text-destructive text-sm">{loadError}</p> : null}

      {result ? <PromotorSuccess result={result} onDismiss={dismissResult} /> : null}

      {promotor ? (
        <PromotorForm
          isSubmitting={isSubmitting}
          error={submitError}
          onSubmit={submit}
          promotorAtual={promotor}
          submitLabel="Salvar alterações"
          gestoresOptions={gestoresOptions}
          minhasBasesSiglas={minhasBasesSiglas}
          todasBases={todasBases}
        />
      ) : null}
    </div>
  );
}
