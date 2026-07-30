"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { INPUT_CLASSES } from "./editar-socio-form";

interface RemoverSocioFormProps {
  agenciaId: string;
  representanteLegalId: string;
  nomeSocio: string;
  removerSocioAction: (
    agenciaId: string,
    representanteLegalId: string,
    formData: FormData,
  ) => Promise<void>;
  disabled?: boolean;
}

// Remoção (soft delete) de um sócio do quadro societário — exige
// justificativa e fica registrada no histórico de edições do cadastro
// (ver RemoverRepresentanteLegalUseCase), mesma exigência de "quem/quando/
// por quê" já aplicada à edição em lote (ver EditarSocioForm).
export function RemoverSocioForm({
  agenciaId,
  representanteLegalId,
  nomeSocio,
  removerSocioAction,
  disabled = false,
}: RemoverSocioFormProps) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={disabled}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Remover
      </button>

      {aberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className="bg-card flex w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
              <span className="text-foreground min-w-0 truncate text-sm font-semibold">
                Remover sócio — {nomeSocio}
              </span>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full p-1 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await removerSocioAction(agenciaId, representanteLegalId, formData);
                setAberto(false);
              }}
              className="flex flex-col gap-3 px-5 py-4"
            >
              <p className="text-muted-foreground text-sm">
                {nomeSocio} sai do quadro de sócios da agência. A remoção fica registrada no
                histórico do cadastro.
              </p>

              <textarea
                name="justificativa"
                required
                rows={3}
                placeholder="Justificativa da remoção (obrigatório)"
                className={INPUT_CLASSES}
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-destructive text-destructive-foreground rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                >
                  Remover sócio
                </button>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="border-input text-foreground hover:bg-accent rounded-full border px-4 py-2 text-sm font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
