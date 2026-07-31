"use client";

import { useState } from "react";
import { X, TriangleAlert, Loader2 } from "lucide-react";
import { INPUT_CLASSES } from "./editar-socio-form";

interface CancelarContratoModalProps {
  agenciaId: string;
  cancelarContratoAction: (agenciaId: string, formData: FormData) => Promise<void>;
  disabled?: boolean;
}

// Mesmo padrão de RemoverSocioForm/ForcarAvancoModal (quem/quando/por quê,
// ver CancelarContratoUseCase) — só que destrutivo (cancela o documento no
// D4Sign de verdade, sem volta) em vez de uma via de escape.
export function CancelarContratoModal({
  agenciaId,
  cancelarContratoAction,
  disabled = false,
}: CancelarContratoModalProps) {
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={disabled}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Cancelar contrato
      </button>

      {aberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !enviando && setAberto(false)}
        >
          <div
            className="bg-card flex w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
              <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <TriangleAlert className="text-destructive size-4" />
                Cancelar contrato
              </span>
              <button
                type="button"
                onClick={() => setAberto(false)}
                disabled={enviando}
                aria-label="Fechar"
                className="text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              action={async (formData) => {
                setEnviando(true);
                try {
                  await cancelarContratoAction(agenciaId, formData);
                  setAberto(false);
                } finally {
                  setEnviando(false);
                }
              }}
              className="flex flex-col gap-3 px-5 py-4"
            >
              <p className="text-muted-foreground text-sm">
                Isso cancela o documento no D4Sign e devolve o cadastro pra Complementar. Uma nova
                aprovação depois gera um contrato novo — esta ação não pode ser desfeita, e fica
                registrada no histórico do cadastro, com o seu usuário e o motivo.
              </p>

              <textarea
                name="justificativa"
                required
                rows={3}
                placeholder="Motivo do cancelamento (obrigatório)"
                disabled={enviando}
                className={INPUT_CLASSES}
              />

              {enviando ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Loader2 className="size-3.5 animate-spin" />
                  Cancelando o contrato — não feche esta janela.
                </p>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={enviando}
                  aria-busy={enviando}
                  className="bg-destructive text-destructive-foreground flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
                  {enviando ? "Cancelando..." : "Cancelar contrato"}
                </button>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  disabled={enviando}
                  className="border-input text-foreground hover:bg-accent rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Voltar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
