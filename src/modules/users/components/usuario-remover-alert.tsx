"use client";

import { TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface UsuarioRemoverAlertProps {
  aberto: boolean;
  nomeCompleto: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// Confirmação de "Remover usuário" (SPEC §4) — role="alertdialog", fecha
// só por Cancelar/overlay/confirmar (não some sozinho). "Remover" de fato
// desativa o acesso, ver deactivate-user.use-case.ts — texto reflete isso
// ("o acesso será excluído"), não uma exclusão de linha do banco.
export function UsuarioRemoverAlert({
  aberto,
  nomeCompleto,
  isSubmitting,
  onCancel,
  onConfirm,
}: UsuarioRemoverAlertProps) {
  return (
    <AlertDialog open={aberto} onOpenChange={(valor) => !valor && onCancel()}>
      <AlertDialogContent className="flex flex-col gap-3.5 p-[26px]">
        <span className="flex size-11 items-center justify-center rounded-full bg-[rgba(239,68,68,0.10)]">
          <TriangleAlert className="size-[22px] text-[#D6336C]" />
        </span>

        <AlertDialogTitle className="text-[1.05rem] font-bold text-[#16162A]">
          Remover {nomeCompleto}?
        </AlertDialogTitle>

        <AlertDialogDescription className="text-[0.875rem] leading-[1.5] text-[#6B6B85]">
          O acesso será excluído e o histórico deixará de ficar vinculado a esta pessoa. Essa ação
          não pode ser desfeita.
        </AlertDialogDescription>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#E4E4EE] bg-white px-4 py-2 text-sm font-medium text-[#4A4A63] transition hover:bg-[#F7F7FB]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-full bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Removendo..." : "Sim, remover"}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
