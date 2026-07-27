"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { cn } from "@/lib/utils";
import {
  useCadastroWizardViewModel,
  type ExecutivoOption,
  type AssociacaoOption,
  type CampoFaltante,
} from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";
import { AnaliseCadastroOverlay } from "@/modules/cadastro/components/analise-cadastro-overlay";
import { WizardStepper } from "@/modules/cadastro/components/wizard-stepper";
import { SecaoCard } from "@/modules/cadastro/components/secao-card";
import { Passo1Documentos } from "@/modules/cadastro/components/steps/passo1-documentos";
import { Passo2Empresa } from "@/modules/cadastro/components/steps/passo2-empresa";
import { Passo5Socios } from "@/modules/cadastro/components/steps/passo5-socios";
import { Passo6Endereco } from "@/modules/cadastro/components/steps/passo6-endereco";
import { Passo7Banco } from "@/modules/cadastro/components/steps/passo7-banco";
import { Passo8ExecutivoAssociacao } from "@/modules/cadastro/components/steps/passo8-executivo-associacao";
import { Passo9Revisao } from "@/modules/cadastro/components/steps/passo9-revisao";

interface CadastroWizardViewProps {
  origem: string | null;
  executivoId: string | null;
  associacaoId: string | null;
  eventoId: string | null;
  executivos: ExecutivoOption[];
  associacoes: AssociacaoOption[];
}

// View: só renderiza, delegando toda a lógica ao ViewModel do wizard.
// Página única: as seções ficam empilhadas e vão sendo reveladas
// conforme o usuário avança (sem bloqueio de validação — só no envio final).
export function CadastroWizardView({
  origem,
  executivoId,
  associacaoId,
  eventoId,
  executivos,
  associacoes,
}: CadastroWizardViewProps) {
  const wizard = useCadastroWizardViewModel({
    origem,
    executivoId,
    associacaoId,
    eventoId,
    executivos,
    associacoes,
  });
  const secaoRefs = useRef<Array<HTMLDivElement | null>>([]);
  const primeiraRenderizacao = useRef(true);
  const secoesTentativaFalhouAnteriorRef = useRef<Set<number>>(new Set());

  function scrollParaSecao(secao: number) {
    secaoRefs.current[secao - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Seções 1 (Empresa)/3 (Endereço)/4 (Banco) têm um botão genérico só
  // (ver mapa abaixo) — Sócios (2) já resolve isso por conta própria
  // dentro de Passo5Socios (pula pro sócio incompleto, não pro campo).
  function camposFaltantesDaSecao(numero: number): CampoFaltante[] {
    if (numero === 1) return wizard.camposFaltantesEmpresa;
    if (numero === 3) return wizard.camposFaltantesEndereco;
    if (numero === 4) return wizard.camposFaltantesBanco;
    return [];
  }

  // Rola até o primeiro campo com erro só quando uma seção ACABOU de
  // falhar uma tentativa (não a cada render enquanto a mensagem já
  // estiver visível, nem quando ela some por ter sido corrigida).
  useEffect(() => {
    const anterior = secoesTentativaFalhouAnteriorRef.current;
    const novasFalhas = [...wizard.secoesTentativaFalhou].filter((numero) => !anterior.has(numero));
    secoesTentativaFalhouAnteriorRef.current = wizard.secoesTentativaFalhou;
    if (novasFalhas.length === 0) return;

    const primeiroCampo = camposFaltantesDaSecao(novasFalhas[0]!)[0]?.campo;
    if (!primeiroCampo) return;

    const el = document.querySelector(`[data-campo="${primeiroCampo}"]`);
    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: reduzMovimento ? "auto" : "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.secoesTentativaFalhou]);

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

  // A confirmação de recebimento é mostrada só pelo AnaliseCadastroOverlay
  // em tela cheia (fase "recebido", renderizado mais abaixo) — nenhuma
  // tela adicional troca por trás disso, pra não duplicar a mensagem em
  // duas telas diferentes.
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
            // Sócios (numero 2) valida por conta própria dentro de
            // Passo5Socios (avança sócio a sócio antes da seção) — os
            // demais passos travam "Continuar" até os campos obrigatórios
            // estarem completos (mesmas regras do envio final).
            const passoCompleto =
              numero === 1
                ? wizard.empresaCompleta
                : numero === 3
                  ? wizard.enderecoCompleto
                  : numero === 4
                    ? wizard.bancoCompleto
                    : true;
            const camposFaltantes = camposFaltantesDaSecao(numero);
            const mostrarErro =
              wizard.secoesTentativaFalhou.has(numero) && camposFaltantes.length > 0;

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
                  {numero === 5 ? <Passo8ExecutivoAssociacao {...wizard} /> : null}
                  {numero === 6 ? <Passo9Revisao {...wizard} /> : null}

                  {podeAvancar && numero !== 2 ? (
                    <div className="flex flex-col items-end gap-2">
                      {mostrarErro ? (
                        <div className="border-destructive bg-destructive-bg text-destructive-text w-full rounded-xl border px-4 py-2.5 text-sm">
                          Preencha antes de continuar:{" "}
                          {camposFaltantes.map((campo) => campo.label).join(", ")}.
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => wizard.tentarAvancarSecao(numero, passoCompleto)}
                        aria-disabled={!passoCompleto}
                        title={
                          passoCompleto
                            ? undefined
                            : "Preencha todos os campos obrigatórios antes de continuar."
                        }
                        className={cn(
                          "w-fit rounded-full px-5 py-2.5 text-sm font-medium transition",
                          passoCompleto
                            ? "bg-primary text-primary-foreground hover:bg-sakura-600"
                            : "bg-primary text-primary-foreground cursor-not-allowed opacity-50",
                        )}
                      >
                        Continuar →
                      </button>
                    </div>
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
