"use client";

import Link from "next/link";
import { useCreatePromotorViewModel } from "@/modules/atribuicoes/view-models/use-create-promotor.view-model";
import { PromotorForm } from "@/modules/atribuicoes/components/promotor-form";
import { PromotorSuccess } from "@/modules/atribuicoes/components/promotor-success";
import type { BaseView } from "@/modules/bases/types/base.types";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";

interface PromotorCreateViewProps {
  gestoresOptions: GestorOpcao[] | null;
  minhasBasesSiglas?: string[];
  todasBases: BaseView[];
}

// Extraído de promotores-view.tsx — antes o formulário de criação ficava
// sempre visível no topo da lista; agora vive na própria rota
// /executivos/novo, aberta a partir do botão "Novo cadastro" da toolbar.
export function PromotorCreateView({
  gestoresOptions,
  minhasBasesSiglas,
  todasBases,
}: PromotorCreateViewProps) {
  const { isSubmitting, error, submit, lastCreatedResult, dismissSuccess } =
    useCreatePromotorViewModel();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-xl font-semibold">Novo executivo</h1>
        <Link
          href="/executivos"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          ← Voltar pra Executivos
        </Link>
      </div>

      {lastCreatedResult ? (
        <PromotorSuccess result={lastCreatedResult} onDismiss={dismissSuccess} />
      ) : (
        <PromotorForm
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={submit}
          gestoresOptions={gestoresOptions}
          minhasBasesSiglas={minhasBasesSiglas}
          todasBases={todasBases}
        />
      )}
    </div>
  );
}
