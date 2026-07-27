"use client";

import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useToastStore,
  type CantoToast,
  type Toast,
  type TipoToast,
} from "@/modules/shared/stores/toast.store";

const CLASSES_POR_TIPO: Record<TipoToast, string> = {
  info: "border-border bg-card text-foreground",
  sucesso: "border-success-text/20 bg-success-bg text-success-text",
  erro: "border-destructive-text/20 bg-destructive-bg text-destructive-text",
};

const CLASSES_POR_CANTO: Record<CantoToast, string> = {
  "superior-direito": "top-4 right-4",
  "inferior-esquerdo": "bottom-4 left-4",
};

function GrupoToasts({
  canto,
  toasts,
  removerToast,
}: {
  canto: CantoToast;
  toasts: Toast[];
  removerToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className={cn("fixed z-[100] flex w-full max-w-sm flex-col gap-2", CLASSES_POR_CANTO[canto])}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg",
            CLASSES_POR_TIPO[toast.tipo],
          )}
        >
          <p className="leading-snug">{toast.mensagem}</p>
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

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const removerToast = useToastStore((state) => state.removerToast);

  if (toasts.length === 0) return null;

  const toastsPorCanto: Record<CantoToast, Toast[]> = {
    "superior-direito": toasts.filter((toast) => toast.canto === "superior-direito"),
    "inferior-esquerdo": toasts.filter((toast) => toast.canto === "inferior-esquerdo"),
  };

  return (
    <>
      <GrupoToasts
        canto="superior-direito"
        toasts={toastsPorCanto["superior-direito"]}
        removerToast={removerToast}
      />
      <GrupoToasts
        canto="inferior-esquerdo"
        toasts={toastsPorCanto["inferior-esquerdo"]}
        removerToast={removerToast}
      />
    </>
  );
}
