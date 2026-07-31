"use client";

import { useState } from "react";
import { X, TriangleAlert, Loader2 } from "lucide-react";
import { INPUT_CLASSES } from "./editar-socio-form";

interface ForcarAvancoModalProps {
  agenciaId: string;
  // Rótulo do próximo status, só pra copy do modal (ex.: "Validação",
  // "Cadastramento") — o use-case decide o destino real sozinho a partir
  // do status atual, ver ForcarAvancoStatusUseCase.
  proximaEtapaLabel: string;
  forcarAvancoStatusAction: (agenciaId: string, formData: FormData) => Promise<void>;
  disabled?: boolean;
}

// Via de escape auditada (quem/quando/por quê, ver ForcarAvancoStatusUseCase)
// pras transições que hoje só acontecem via webhook do D4Sign — pra quando
// a plataforma não conseguir fazer isso sozinha (webhook perdido, D4Sign
// fora do ar etc.). Mesmo padrão de modal de RemoverSocioForm, com aviso de
// que é uma exceção, não o caminho normal.
export function ForcarAvancoModal({
  agenciaId,
  proximaEtapaLabel,
  forcarAvancoStatusAction,
  disabled = false,
}: ForcarAvancoModalProps) {
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={disabled}
        className="border-warning/40 text-warning hover:bg-warning/10 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Forçar avanço
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
                <TriangleAlert className="text-warning size-4" />
                Forçar avanço para {proximaEtapaLabel}
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
                  await forcarAvancoStatusAction(agenciaId, formData);
                  setAberto(false);
                } finally {
                  setEnviando(false);
                }
              }}
              className="flex flex-col gap-3 px-5 py-4"
            >
              <p className="text-muted-foreground text-sm">
                Use só quando a plataforma não conseguir avançar sozinha (ex.: webhook do D4Sign não
                chegou). Isso avança o cadastro sem essa confirmação automática e fica registrado no
                histórico do cadastro, com o seu usuário e o motivo.
              </p>

              <textarea
                name="justificativa"
                required
                rows={3}
                placeholder="Justificativa do avanço forçado (obrigatório)"
                disabled={enviando}
                className={INPUT_CLASSES}
              />

              {enviando ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Loader2 className="size-3.5 animate-spin" />
                  Avançando o cadastro — não feche esta janela.
                </p>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={enviando}
                  aria-busy={enviando}
                  className="bg-warning text-warning-foreground flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
                  {enviando ? "Enviando..." : "Forçar avanço"}
                </button>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  disabled={enviando}
                  className="border-input text-foreground hover:bg-accent rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
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
