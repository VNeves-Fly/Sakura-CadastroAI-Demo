"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateGestorViewModel } from "@/modules/gestores/view-models/use-create-gestor.view-model";
import { useUpdateGestorViewModel } from "@/modules/gestores/view-models/use-update-gestor.view-model";
import { GestorForm } from "@/modules/gestores/components/gestor-form";
import { GestorSuccess } from "@/modules/gestores/components/gestor-success";
import type { BaseView } from "@/modules/bases/types/base.types";

interface GestorCadastroModalProps {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  basesOptions: BaseView[];
  // Presente = modo edição: abre pré-preenchido com os dados desse gestor
  // (mesmo GestorForm da criação, só que com gestorAtual) em vez do form em
  // branco. Modal unificado pra Novo/Editar, pedido do usuário 2026-08-26 —
  // o antigo modal de edição rápida (gestor-edicao-modal.tsx, removido) não
  // tinha SICA/Bases/Acesso à plataforma, só Nome/Nível/E-mail/Telefone.
  gestorId?: string | null;
}

// "+ Novo cadastro" da lista de Gestores abre isto em vez de navegar pra
// uma página própria (pedido do usuário, 2026-08-17 — print de referência).
// Fica aberto depois do sucesso pra mostrar a senha temporária (só aparece
// uma vez, ver GestorSuccess) — fecha só quando o usuário clica em X.
export function GestorCadastroModal({
  aberto,
  onOpenChange,
  basesOptions,
  gestorId = null,
}: GestorCadastroModalProps) {
  const modoEdicao = gestorId !== null;

  // Os dois hooks são chamados sempre (regra de hooks) — só um dos dois é
  // usado por vez, conforme modoEdicao. useUpdateGestorViewModel(null) não
  // dispara fetch nenhum, ver comentário lá.
  const criacao = useCreateGestorViewModel();
  const edicao = useUpdateGestorViewModel(gestorId);

  const isSubmitting = modoEdicao ? edicao.isSubmitting : criacao.isSubmitting;
  const error = modoEdicao ? edicao.submitError : criacao.error;
  const submit = modoEdicao ? edicao.submit : criacao.submit;
  const resultado = modoEdicao ? edicao.result : criacao.lastCreatedResult;

  function fechar() {
    onOpenChange(false);
    criacao.dismissSuccess();
    edicao.dismissResult();
  }

  const aberto2 = modoEdicao ? true : aberto;

  return (
    <Dialog open={aberto2} onOpenChange={(valor) => (valor ? onOpenChange(true) : fechar())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{modoEdicao ? "Editar gestor" : "Novo gestor"}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-4">
          {modoEdicao && edicao.isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : null}
          {modoEdicao && edicao.loadError ? (
            <p className="text-destructive text-sm">{edicao.loadError}</p>
          ) : null}

          {resultado ? (
            <GestorSuccess result={resultado} onDismiss={fechar} />
          ) : (!modoEdicao || edicao.gestor) && !(modoEdicao && edicao.isLoading) ? (
            <GestorForm
              key={gestorId ?? "novo"}
              className="flex flex-col gap-4"
              mostrarTitulo={false}
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={submit}
              gestorAtual={edicao.gestor ?? undefined}
              submitLabel={modoEdicao ? "Salvar alterações" : undefined}
              basesOptions={basesOptions}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
