"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateGestorViewModel } from "@/modules/gestores/view-models/use-create-gestor.view-model";
import { GestorForm } from "@/modules/gestores/components/gestor-form";
import { GestorSuccess } from "@/modules/gestores/components/gestor-success";
import type { BaseView } from "@/modules/bases/types/base.types";

interface GestorCadastroModalProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  basesOptions: BaseView[];
}

// "+ Novo cadastro" da lista de Gestores abre isto em vez de navegar pra
// uma página própria (pedido do usuário, 2026-08-17 — print de referência).
// Fica aberto depois do sucesso pra mostrar a senha temporária (só aparece
// uma vez, ver GestorSuccess) — fecha só quando o usuário clica em X.
export function GestorCadastroModal({
  aberto,
  onOpenChange,
  basesOptions,
}: GestorCadastroModalProps) {
  const { isSubmitting, error, submit, lastCreatedResult, dismissSuccess } =
    useCreateGestorViewModel();

  function fechar() {
    onOpenChange(false);
    dismissSuccess();
  }

  return (
    <Dialog open={aberto} onOpenChange={(valor) => (valor ? onOpenChange(true) : fechar())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo gestor</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-4">
          {lastCreatedResult ? (
            <GestorSuccess result={lastCreatedResult} onDismiss={fechar} />
          ) : (
            <GestorForm
              className="flex flex-col gap-4"
              mostrarTitulo={false}
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={submit}
              basesOptions={basesOptions}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
