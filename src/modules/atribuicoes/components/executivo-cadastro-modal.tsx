"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreatePromotorViewModel } from "@/modules/atribuicoes/view-models/use-create-promotor.view-model";
import { PromotorForm } from "@/modules/atribuicoes/components/promotor-form";
import { PromotorSuccess } from "@/modules/atribuicoes/components/promotor-success";
import type { BaseView } from "@/modules/bases/types/base.types";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";

interface ExecutivoCadastroModalProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  // null = usuário logado é Gestor (gestorId travado no dele, campo nem
  // aparece); array = Admin/Diretor, escolhe entre todos os Gestores.
  gestoresOptions: GestorOpcao[] | null;
  minhasBasesSiglas?: string[];
  todasBases: BaseView[];
}

// "+ Novo cadastro" da lista de Executivos abre isto em vez de navegar pra
// uma página própria — padronizado com o modal de Gestores (pedido do
// usuário, 2026-08-25). Fica aberto depois do sucesso pra mostrar a senha
// temporária (só aparece uma vez, ver PromotorSuccess) — fecha só quando o
// usuário clica em X.
export function ExecutivoCadastroModal({
  aberto,
  onOpenChange,
  gestoresOptions,
  minhasBasesSiglas,
  todasBases,
}: ExecutivoCadastroModalProps) {
  const { isSubmitting, error, submit, lastCreatedResult, dismissSuccess } =
    useCreatePromotorViewModel();

  function fechar() {
    onOpenChange(false);
    dismissSuccess();
  }

  return (
    <Dialog open={aberto} onOpenChange={(valor) => (valor ? onOpenChange(true) : fechar())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo executivo</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-4">
          {lastCreatedResult ? (
            <PromotorSuccess result={lastCreatedResult} onDismiss={fechar} />
          ) : (
            <PromotorForm
              className="flex flex-col gap-4"
              mostrarTitulo={false}
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={submit}
              gestoresOptions={gestoresOptions}
              minhasBasesSiglas={minhasBasesSiglas}
              todasBases={todasBases}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
