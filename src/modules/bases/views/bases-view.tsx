"use client";

import { useBasesListViewModel } from "@/modules/bases/view-models/use-bases-list.view-model";
import { useCreateBaseViewModel } from "@/modules/bases/view-models/use-create-base.view-model";
import { BaseForm } from "@/modules/bases/components/base-form";
import { BaseList } from "@/modules/bases/components/base-list";

export function BasesView() {
  const { bases, isLoading, error } = useBasesListViewModel();
  const { isSubmitting, error: createError, submit } = useCreateBaseViewModel();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-foreground text-xl font-semibold">Bases</h1>
      <BaseForm isSubmitting={isSubmitting} error={createError} onSubmit={submit} />
      <BaseList bases={bases} isLoading={isLoading} error={error} />
    </div>
  );
}
