"use client";

import Image from "next/image";
import { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";
import { WizardStepper } from "@/modules/cadastro/components/wizard-stepper";
import { Passo1Documentos } from "@/modules/cadastro/components/steps/passo1-documentos";

interface CadastroWizardViewProps {
  origem: string | null;
}

// View: só renderiza, delegando toda a lógica ao ViewModel do wizard.
export function CadastroWizardView({ origem }: CadastroWizardViewProps) {
  const wizard = useCadastroWizardViewModel({ origem });

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-background px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-sakura-900/5 sm:p-10">
        <div className="mb-6 flex items-center justify-center">
          <Image
            src="/logos/logo-sakura-oficial.png"
            alt="Sakura Consolidadora"
            width={140}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

        <div className="mb-8">
          <WizardStepper
            etapaAtual={wizard.etapaAtual}
            totalEtapas={wizard.totalEtapas}
            maiorEtapaAlcancada={wizard.maiorEtapaAlcancada}
            labels={wizard.labels}
            onIrParaEtapa={wizard.irParaEtapa}
          />
        </div>

        {wizard.etapaAtual === 1 ? (
          <Passo1Documentos {...wizard} />
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Passo &quot;{wizard.labels[wizard.etapaAtual - 1]}&quot; ainda não implementado nesta
            fase.
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={wizard.etapaAnterior}
            disabled={wizard.etapaAtual === 1}
            className="rounded-full border border-input px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Voltar
          </button>
          <button
            type="button"
            onClick={wizard.proximaEtapa}
            disabled={wizard.etapaAtual === wizard.totalEtapas}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-sakura-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Avançar →
          </button>
        </div>
      </div>

      <footer className="flex w-full max-w-2xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} Sakura Consolidadora</span>
        <div className="flex items-center gap-4">
          <a href="/termos" className="hover:text-foreground hover:underline">
            Termos de uso
          </a>
          <a href="/privacidade" className="hover:text-foreground hover:underline">
            Política de privacidade
          </a>
        </div>
      </footer>
    </div>
  );
}
