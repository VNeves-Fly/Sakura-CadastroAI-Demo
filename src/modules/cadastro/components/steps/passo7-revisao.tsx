"use client";

import { BriefcaseIcon } from "@/modules/cadastro/components/icons";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";

type Passo7RevisaoProps = ReturnType<typeof useCadastroWizardViewModel>;

// Componente apenas de renderização: recebe estado e callbacks do
// ViewModel do wizard via props. Sem campos novos — só o checklist de
// documentos e o envio final.
export function Passo7Revisao({
  documentosPendentes,
  isSubmitting,
  submitError,
  submit,
}: Passo7RevisaoProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Confira se todos os documentos foram anexados antes de enviar o cadastro.
      </p>

      {documentosPendentes.length > 0 ? (
        <div className="rounded-xl bg-warning/15 px-4 py-3 text-sm text-warning">
          <p className="font-semibold">Documentos pendentes:</p>
          <ul className="mt-1 list-disc pl-5">
            {documentosPendentes.map((documento) => (
              <li key={documento}>{documento}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl bg-success/15 px-4 py-3 text-sm font-medium text-success">
          ✓ Todos os documentos foram anexados.
        </div>
      )}

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-sakura-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <BriefcaseIcon />
        {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
      </button>
    </div>
  );
}
