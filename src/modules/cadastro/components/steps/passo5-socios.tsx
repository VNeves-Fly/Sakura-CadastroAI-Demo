"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SocioWizardCard } from "@/modules/cadastro/components/socio-wizard-card";
import { PersonPlusIcon } from "@/modules/cadastro/components/icons";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";
import type { SocioWizardValidacao } from "@/modules/cadastro/types/socio-wizard.types";

type Passo5SociosProps = ReturnType<typeof useCadastroWizardViewModel> & {
  podeAvancar: boolean;
};

// sociosValidacao é sempre calculado a partir do mesmo array de socios
// (mesmo tamanho); o fallback só existe pra satisfazer o tipo.
const VALIDACAO_VAZIA: SocioWizardValidacao = {
  cpfStatus: { valido: false, mensagem: null },
  dataNascimentoStatus: { valido: false, mensagem: null },
  emailInvalido: false,
  emailErro: null,
  telefoneInvalido: false,
  rgErro: null,
  procuracaoErro: null,
};

const ANALISE_IDENTIFICACAO_VAZIA = { analisando: false, analise: null };

function prefereMovimentoReduzido(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Componente apenas de renderização: recebe estado e callbacks do
// ViewModel do wizard via props. Carrossel — só o sócio ativo aparece com
// o formulário completo montado; o índice ativo é estado puramente de UI
// (não vive no ViewModel, igual secao-colapsavel.tsx trata aberta/animando).
export function Passo5Socios({
  socios,
  sociosValidacao,
  sociosAnaliseIdentificacao,
  sociosCompletos,
  sociosCamposFaltantes,
  socioCepBuscando,
  analisandoContratoSocial,
  podeAvancar,
  secoesTentativaFalhou,
  tentarAvancarSecao,
  addSocio,
  removeSocio,
  updateSocio,
  toggleRepresentante,
  buscarCepSocio,
}: Passo5SociosProps) {
  const [socioAtivoIndex, setSocioAtivoIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const primeiraRenderizacao = useRef(true);

  // Se um sócio for removido e o índice ativo ficar fora do range, cai
  // pro último sócio restante em vez de apontar pra um índice inexistente.
  useEffect(() => {
    if (socioAtivoIndex > socios.length - 1) {
      setSocioAtivoIndex(Math.max(0, socios.length - 1));
    }
  }, [socios.length, socioAtivoIndex]);

  // Anima a entrada do card do sócio ativo (fade + leve deslocamento
  // horizontal, estilo carrossel) a cada troca — pula na primeira
  // renderização e respeita "menos movimento" do SO, mesmo padrão de
  // secao-colapsavel.tsx e cadastro-wizard-view.tsx.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const ehPrimeira = primeiraRenderizacao.current;
    primeiraRenderizacao.current = false;
    if (ehPrimeira || prefereMovimentoReduzido()) return;

    animate(el, {
      opacity: [0, 1],
      translateX: [16, 0],
      duration: 320,
      ease: "outQuad",
    });
  }, [socioAtivoIndex]);

  function handleAddSocio() {
    addSocio();
    setSocioAtivoIndex(socios.length);
  }

  // Quando há mais de um sócio, o botão não avança pro próximo passo do
  // wizard direto enquanto algum sócio ainda tiver dado obrigatório
  // faltando (nome, CPF, e-mail, telefone, data de nascimento, estado
  // civil, endereço, RG/CNH e procuração se for representante) — em vez
  // disso, pula pro primeiro sócio incompleto (mesma ordem do array), pra
  // não deixar o cliente pular um sócio sem querer achando que o botão
  // sempre significa ir pra próxima seção. Só quando todos os sócios
  // estiverem completos o botão vira "Continuar" de verdade.
  const indicePendente = socios.findIndex((_, index) => !sociosCompletos[index]);
  const haSocioPendente = indicePendente !== -1;

  function handleContinuar() {
    if (haSocioPendente) {
      tentarAvancarSecao(2, false);
      setSocioAtivoIndex(indicePendente);
      cardRef.current?.scrollIntoView({
        behavior: prefereMovimentoReduzido() ? "auto" : "smooth",
        block: "start",
      });
      return;
    }
    tentarAvancarSecao(2, true);
  }

  const socioAtivo = socios[socioAtivoIndex];
  const camposFaltantesSocioAtivo = sociosCamposFaltantes[socioAtivoIndex] ?? [];
  const mostrarErroSocio = secoesTentativaFalhou.has(2) && camposFaltantesSocioAtivo.length > 0;

  // Os campos de sócio são preenchidos automaticamente pela análise do
  // contrato social (Passo 1) — mostrar o formulário vazio antes da
  // análise terminar deixaria o usuário preenchendo à mão algo que a IA
  // está prestes a completar sozinha, só pra ver tudo mudar debaixo dela.
  if (analisandoContratoSocial) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Anexe o RG ou CNH de cada sócio — a IA analisa e ajuda a preencher o resto do cadastro.
        </p>
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Loader2 className="size-3.5 animate-spin" />
          Extraindo os dados do contrato social...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground min-w-0 flex-1 text-sm">
          Anexe o RG ou CNH de cada sócio — a IA analisa e ajuda a preencher o resto do cadastro.
        </p>
        <button
          type="button"
          onClick={handleAddSocio}
          className="text-primary flex shrink-0 items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          <PersonPlusIcon />
          Adicionar sócio
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {socios.map((socio, index) => {
          const analise = sociosAnaliseIdentificacao[index] ?? ANALISE_IDENTIFICACAO_VAZIA;
          const ativo = index === socioAtivoIndex;
          const rotulo = socio.nome || `Sócio ${index + 1}`;

          return (
            <button
              key={index}
              type="button"
              onClick={() => setSocioAtivoIndex(index)}
              aria-current={ativo}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                ativo
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              {analise.analisando ? <Loader2 className="size-3 animate-spin" /> : null}
              {rotulo}
              {!sociosCompletos[index] ? (
                <span className="text-warning" title="Faltam dados obrigatórios">
                  •
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {socioAtivo ? (
        <div key={socioAtivoIndex} ref={cardRef}>
          <SocioWizardCard
            index={socioAtivoIndex}
            socio={socioAtivo}
            validacao={sociosValidacao[socioAtivoIndex] ?? VALIDACAO_VAZIA}
            analiseIdentificacao={
              sociosAnaliseIdentificacao[socioAtivoIndex] ?? ANALISE_IDENTIFICACAO_VAZIA
            }
            podeRemover={socios.length > 1}
            cepBuscando={socioCepBuscando === socioAtivoIndex}
            camposFaltantes={mostrarErroSocio ? camposFaltantesSocioAtivo : []}
            onUpdate={(patch) => updateSocio(socioAtivoIndex, patch)}
            onRemove={() => removeSocio(socioAtivoIndex)}
            onToggleRepresentante={() => toggleRepresentante(socioAtivoIndex)}
            onBuscarCep={() => buscarCepSocio(socioAtivoIndex)}
          />
        </div>
      ) : null}

      {podeAvancar ? (
        <div className="flex flex-col items-end gap-2">
          {mostrarErroSocio ? (
            <div className="border-destructive bg-destructive-bg text-destructive-text w-full rounded-xl border px-4 py-2.5 text-sm">
              Preencha antes de continuar:{" "}
              {camposFaltantesSocioAtivo.map((campo) => campo.label).join(", ")}.
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleContinuar}
            aria-disabled={haSocioPendente}
            className={cn(
              "w-fit rounded-full px-5 py-2.5 text-sm font-medium transition",
              haSocioPendente
                ? "bg-primary text-primary-foreground cursor-not-allowed opacity-50"
                : "bg-primary text-primary-foreground hover:bg-sakura-600",
            )}
          >
            {haSocioPendente ? "Próximo →" : "Continuar →"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
