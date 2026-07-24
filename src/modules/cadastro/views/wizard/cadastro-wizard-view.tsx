"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";
import { AnaliseCadastroOverlay } from "@/modules/cadastro/components/analise-cadastro-overlay";
import { WizardStepper } from "@/modules/cadastro/components/wizard-stepper";
import { SecaoCard } from "@/modules/cadastro/components/secao-card";
import { Passo1Documentos } from "@/modules/cadastro/components/steps/passo1-documentos";
import { Passo2Empresa } from "@/modules/cadastro/components/steps/passo2-empresa";
import { Passo5Socios } from "@/modules/cadastro/components/steps/passo5-socios";
import { Passo6Endereco } from "@/modules/cadastro/components/steps/passo6-endereco";
import { Passo7Banco } from "@/modules/cadastro/components/steps/passo7-banco";
import { Passo8Revisao } from "@/modules/cadastro/components/steps/passo8-revisao";

interface CadastroWizardViewProps {
  origem: string | null;
  promotorLinkId: string | null;
}

// View: só renderiza, delegando toda a lógica ao ViewModel do wizard.
// Página única: as seções ficam empilhadas e vão sendo reveladas
// conforme o usuário avança (sem bloqueio de validação — só no envio final).
export function CadastroWizardView({ origem, promotorLinkId }: CadastroWizardViewProps) {
  const wizard = useCadastroWizardViewModel({ origem, promotorLinkId });
  const secaoRefs = useRef<Array<HTMLDivElement | null>>([]);
  const primeiraRenderizacao = useRef(true);

  function scrollParaSecao(secao: number) {
    secaoRefs.current[secao - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Anima a entrada de cada seção nova revelada (fade + leve deslocamento
  // vertical) e rola até ela — só pula a animação (não o scroll) se o
  // usuário pediu menos movimento no SO. A primeira seção, no carregamento
  // inicial da página, só recebe o fade — sem scroll, pra não pular a tela.
  useEffect(() => {
    const el = secaoRefs.current[wizard.secoesReveladas - 1];
    if (!el) return;

    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ehPrimeira = primeiraRenderizacao.current;
    primeiraRenderizacao.current = false;

    if (reduzMovimento) {
      if (!ehPrimeira) el.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }

    animate(el, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 420,
      ease: "outQuad",
    });

    if (!ehPrimeira) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [wizard.secoesReveladas]);

  const secoesVisiveis = Array.from({ length: wizard.secoesReveladas }, (_, index) => index + 1);

  // O desfecho de sucesso (aprovado ou enviado pra análise) é mostrado só
  // pelo AnaliseCadastroOverlay em tela cheia (fase "aprovado"/"revisao",
  // renderizado mais abaixo) — nenhuma tela adicional troca por trás
  // disso, pra não duplicar a mensagem em duas telas diferentes.
  if (wizard.submitDuplicado) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
        <div className="border-border bg-card shadow-sakura-900/5 w-full max-w-md rounded-[2rem] border p-8 text-center shadow-xl">
          <h1 className="text-foreground text-2xl font-semibold">Já Cadastrada</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Este CNPJ já possui um cadastro em andamento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center gap-6 px-4 py-10">
      <div className="border-border bg-card shadow-sakura-900/5 w-full max-w-2xl rounded-[2rem] border p-6 shadow-xl sm:p-10">
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
                  ) : null}
                  {numero === 2 ? <Passo5Socios {...wizard} podeAvancar={podeAvancar} /> : null}
                  {numero === 3 ? <Passo6Endereco {...wizard} /> : null}
                  {numero === 4 ? <Passo7Banco {...wizard} /> : null}
                  {numero === 5 ? <Passo8Revisao {...wizard} /> : null}

                  {podeAvancar && numero !== 2 ? (
                    <button
                      type="button"
                      onClick={wizard.avancarSecao}
                      className="bg-primary text-primary-foreground hover:bg-sakura-600 w-fit self-end rounded-full px-5 py-2.5 text-sm font-medium transition"
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

      <footer className="text-muted-foreground flex w-full max-w-2xl flex-col items-center justify-between gap-2 text-xs sm:flex-row">
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

      {wizard.faseSubmit !== "idle" ? <AnaliseCadastroOverlay fase={wizard.faseSubmit} /> : null}
    </div>
  );
}
