"use client";

import Image from "next/image";
import { useRef } from "react";
import { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";
import { WizardStepper } from "@/modules/cadastro/components/wizard-stepper";
import { SecaoCard } from "@/modules/cadastro/components/secao-card";
import { Passo1Documentos } from "@/modules/cadastro/components/steps/passo1-documentos";
import { Passo2Empresa } from "@/modules/cadastro/components/steps/passo2-empresa";

interface CadastroWizardViewProps {
  origem: string | null;
}

// View: só renderiza, delegando toda a lógica ao ViewModel do wizard.
// Página única: as seções ficam empilhadas e vão sendo reveladas
// conforme o usuário avança (sem bloqueio de validação — só no envio final).
export function CadastroWizardView({ origem }: CadastroWizardViewProps) {
  const wizard = useCadastroWizardViewModel({ origem });
  const secaoRefs = useRef<Array<HTMLDivElement | null>>([]);

  function scrollParaSecao(secao: number) {
    secaoRefs.current[secao - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const secoesVisiveis = Array.from({ length: wizard.secoesReveladas }, (_, index) => index + 1);

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
            secoesReveladas={wizard.secoesReveladas}
            totalEtapas={wizard.totalEtapas}
            labels={wizard.labels}
            onClickSecao={scrollParaSecao}
          />
        </div>

        <div className="flex flex-col gap-6">
          {secoesVisiveis.map((numero) => {
            const concluida = numero < wizard.secoesReveladas;
            const ehAtual = numero === wizard.secoesReveladas;
            const podeAvancar = ehAtual && numero < wizard.totalEtapas;

            return (
              <div
                key={numero}
                ref={(el) => {
                  secaoRefs.current[numero - 1] = el;
                }}
                className="scroll-mt-6"
              >
                <SecaoCard
                  numero={numero}
                  titulo={wizard.labels[numero - 1] ?? ""}
                  concluida={concluida}
                >
                  {numero === 1 ? (
                    <div className="flex flex-col gap-8">
                      <Passo1Documentos {...wizard} />
                      <Passo2Empresa {...wizard} />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      Seção &quot;{wizard.labels[numero - 1]}&quot; ainda não implementada nesta
                      fase.
                    </div>
                  )}

                  {podeAvancar ? (
                    <button
                      type="button"
                      onClick={wizard.avancarSecao}
                      className="w-fit self-end rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-sakura-600"
                    >
                      Continuar →
                    </button>
                  ) : null}
                </SecaoCard>
              </div>
            );
          })}
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
