"use client";

import { useState } from "react";
import { BriefcaseIcon } from "@/modules/cadastro/components/icons";
import { RevisaoContratoModal } from "@/modules/cadastro/components/revisao-contrato-modal";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";

type Passo7RevisaoProps = ReturnType<typeof useCadastroWizardViewModel>;

// Componente apenas de renderização: recebe estado e callbacks do
// ViewModel do wizard via props. O botão final abre o modal de revisão
// (RevisaoContratoModal) — o submit real só acontece lá, depois do
// aceite explícito do usuário.
export function Passo7Revisao(wizard: Passo7RevisaoProps) {
  const { documentosPendentes, isSubmitting } = wizard;
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-sm">
        Confira se todos os documentos foram anexados antes de gerar o contrato.
      </p>

      {documentosPendentes.length > 0 ? (
        <div className="bg-warning/15 text-warning rounded-xl px-4 py-3 text-sm">
          <p className="font-semibold">Documentos pendentes:</p>
          <ul className="mt-1 list-disc pl-5">
            {documentosPendentes.map((documento) => (
              <li key={documento}>{documento}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-success/15 text-success rounded-xl px-4 py-3 text-sm font-medium">
          ✓ Todos os documentos foram anexados.
        </div>
      )}

      <button
        type="button"
        onClick={() => setModalAberto(true)}
        disabled={documentosPendentes.length > 0 || isSubmitting}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        <BriefcaseIcon />
        Revisar e Enviar Cadastro
      </button>

      <RevisaoContratoModal
        {...wizard}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      />
    </div>
  );
}
