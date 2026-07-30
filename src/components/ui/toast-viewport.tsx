"use client";

import Link from "next/link";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore, type TipoToast } from "@/modules/shared/stores/toast.store";

const CLASSES_POR_TIPO: Record<TipoToast, string> = {
  info: "border-border bg-card text-foreground",
  sucesso: "border-success-text/20 bg-success-bg text-success-text",
  erro: "border-destructive-text/20 bg-destructive-bg text-destructive-text",
};

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const removerToast = useToastStore((state) => state.removerToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg",
            CLASSES_POR_TIPO[toast.tipo],
          )}
        >
          <div className="flex flex-1 flex-col gap-1">
            {toast.titulo && (
              <div className="flex items-center justify-between gap-3">
                <p className="leading-snug font-medium">{toast.titulo}</p>
                {toast.acao && (
                  <Link
                    href={toast.acao.href}
                    onClick={() => removerToast(toast.id)}
                    className="shrink-0 rounded-md border border-current/30 px-2 py-0.5 text-xs font-semibold transition hover:bg-current/10"
                  >
                    {toast.acao.label}
                  </Link>
                )}
              </div>
            )}
            <p className="leading-snug">{toast.mensagem}</p>
          </div>
          <button
            type="button"
            onClick={() => removerToast(toast.id)}
            className="shrink-0 opacity-60 transition hover:opacity-100"
            aria-label="Fechar notificação"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
