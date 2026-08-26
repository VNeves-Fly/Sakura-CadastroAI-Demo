"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreatePromotorViewModel } from "@/modules/atribuicoes/view-models/use-create-promotor.view-model";
import { useUpdatePromotorViewModel } from "@/modules/atribuicoes/view-models/use-update-promotor.view-model";
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
  // Presente = modo edição: abre pré-preenchido com os dados desse executivo
  // (mesmo PromotorForm da criação, só que com promotorAtual) em vez do form
  // em branco. Modal unificado pra Novo/Editar, pedido do usuário 2026-08-26
  // — o antigo modal de edição rápida (executivo-edicao-modal.tsx, removido)
  // não tinha SICA/Bases/Acesso à plataforma, só Nome/E-mail/Telefone.
  promotorId?: string | null;
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
  promotorId = null,
}: ExecutivoCadastroModalProps) {
  const modoEdicao = promotorId !== null;

  // Os dois hooks são chamados sempre (regra de hooks) — só um dos dois é
  // usado por vez, conforme modoEdicao. useUpdatePromotorViewModel(null)
  // não dispara fetch nenhum, ver comentário lá.
  const criacao = useCreatePromotorViewModel();
  const edicao = useUpdatePromotorViewModel(promotorId);

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
          <DialogTitle>{modoEdicao ? "Editar executivo" : "Novo executivo"}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-4">
          {modoEdicao && edicao.isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : null}
          {modoEdicao && edicao.loadError ? (
            <p className="text-destructive text-sm">{edicao.loadError}</p>
          ) : null}

          {resultado ? (
            <PromotorSuccess result={resultado} onDismiss={fechar} />
          ) : (!modoEdicao || edicao.promotor) && !(modoEdicao && edicao.isLoading) ? (
            <PromotorForm
              key={promotorId ?? "novo"}
              className="flex flex-col gap-4"
              mostrarTitulo={false}
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={submit}
              promotorAtual={edicao.promotor ?? undefined}
              submitLabel={modoEdicao ? "Salvar alterações" : undefined}
              gestoresOptions={gestoresOptions}
              minhasBasesSiglas={minhasBasesSiglas}
              todasBases={todasBases}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
