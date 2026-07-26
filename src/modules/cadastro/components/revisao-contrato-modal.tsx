"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate } from "animejs";
import { paisTelefonePorCodigo } from "@/modules/shared/utils/telefone.util";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import { PencilIcon } from "@/modules/cadastro/components/icons";
import { SocioWizardCard } from "@/modules/cadastro/components/socio-wizard-card";
import { Passo2Empresa } from "@/modules/cadastro/components/steps/passo2-empresa";
import { Passo6Endereco } from "@/modules/cadastro/components/steps/passo6-endereco";
import { Passo7Banco } from "@/modules/cadastro/components/steps/passo7-banco";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";

// sócio já preenchido no wizard: não há análise de identificação em
// andamento pra mostrar aqui.
const ANALISE_IDENTIFICACAO_VAZIA = { analisando: false, analise: null };

type RevisaoContratoModalProps = ReturnType<typeof useCadastroWizardViewModel> & {
  aberto: boolean;
  onFechar: () => void;
};

function labelEstadoCivil(valor: string): string {
  return ESTADO_CIVIL_OPCOES.find((opcao) => opcao.valor === valor)?.label ?? "—";
}

function telefoneFormatado(telefone: string, pais: string): string {
  if (!telefone) return "—";
  const { bandeira, ddi } = paisTelefonePorCodigo(pais);
  return `${bandeira} ${ddi} ${telefone}`;
}

interface CabecalhoSecaoProps {
  titulo: string;
  editando: boolean;
  onToggle: () => void;
}

// Cabeçalho reaproveitado pelas seções editáveis — o botão só alterna
// entre a visão em texto (dl/dd) e o formulário real da etapa
// correspondente do wizard, que já vive fora daqui (SOLID: nenhuma regra
// de validação é duplicada neste componente).
function CabecalhoSecao({ titulo, editando, onToggle }: CabecalhoSecaoProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">{titulo}</h3>
      <button
        type="button"
        onClick={onToggle}
        className="text-primary flex items-center gap-1 text-xs font-semibold hover:underline"
      >
        <PencilIcon />
        {editando ? "Concluir edição" : "Editar"}
      </button>
    </div>
  );
}

// Modal de revisão final: mostra tudo que o usuário preencheu nas
// seções anteriores + um aceite explícito. Cada seção pode ser aberta em
// modo de edição, que renderiza o mesmo componente de etapa usado no
// wizard (mesmo estado do Zustand, sem cópia paralela) — CNPJ, contrato
// social e uploads de RG/procuração ficam fora da edição aqui de
// propósito (arquivo/CNPJ mexem em fluxo próprio, ver Voltar e editar).
// Só ao confirmar o aceite e clicar em "Criar Contrato" é que o submit
// real acontece (gera e envia o contrato pelo D4Sign, no mesmo request
// que salva o cadastro).
export function RevisaoContratoModal(props: RevisaoContratoModalProps) {
  const {
    aberto,
    onFechar,
    cnpj,
    razaoSocial,
    contratoSocial,
    telefoneComercial,
    telefoneComercialPais,
    semTelefoneComercial,
    emailOperacional,
    emailComercial,
    emailFinanceiro,
    socios,
    sociosValidacao,
    sociosAnaliseIdentificacao,
    socioCepBuscando,
    updateSocio,
    toggleRepresentante,
    buscarCepSocio,
    enderecoBanco,
    isSubmitting,
    submitError,
    submit,
  } = props;

  const [aceite, setAceite] = useState(false);
  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [editandoSocios, setEditandoSocios] = useState(false);
  const [editandoEndereco, setEditandoEndereco] = useState(false);
  const [editandoBanco, setEditandoBanco] = useState(false);

  // O modal nunca é desmontado pelo pai (Passo9Revisao sempre renderiza
  // <RevisaoContratoModal aberto={...} />) — só alterna entre `aberto`
  // true/false. Por isso dá pra controlar a saída aqui dentro: `visivel`
  // mantém o DOM montado um pouco além de `aberto` viar false, só o
  // tempo da animação de fade-out antes de chamar onFechar de verdade.
  const [visivel, setVisivel] = useState(false);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const painelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (aberto) setVisivel(true);
  }, [aberto]);

  useEffect(() => {
    if (!visivel || !aberto || !backdropRef.current || !painelRef.current) return;

    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzMovimento) return;

    animate(backdropRef.current, { opacity: [0, 1], duration: 220, ease: "outQuad" });
    animate(painelRef.current, {
      opacity: [0, 1],
      translateY: [24, 0],
      scale: [0.96, 1],
      duration: 320,
      ease: "outCubic",
    });
  }, [visivel, aberto]);

  function handleFechar() {
    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduzMovimento || !backdropRef.current || !painelRef.current) {
      onFechar();
      setVisivel(false);
      return;
    }

    animate(painelRef.current, {
      opacity: [1, 0],
      translateY: [0, 16],
      scale: [1, 0.96],
      duration: 200,
      ease: "inQuad",
    });
    animate(backdropRef.current, {
      opacity: [1, 0],
      duration: 220,
      ease: "inQuad",
      onComplete: () => {
        onFechar();
        setVisivel(false);
      },
    });
  }

  if (!visivel) return null;

  const editandoAlgo = editandoEmpresa || editandoSocios || editandoEndereco || editandoBanco;

  const socioVinculado =
    enderecoBanco.enderecoMesmoSocio && enderecoBanco.socioEnderecoVinculado !== null
      ? (socios[enderecoBanco.socioEnderecoVinculado] ?? null)
      : null;

  const enderecoAgencia = socioVinculado
    ? {
        logradouro: socioVinculado.logradouro,
        numero: socioVinculado.numero,
        bairro: socioVinculado.bairro,
        cidade: socioVinculado.cidade,
        uf: socioVinculado.uf,
      }
    : {
        logradouro: enderecoBanco.logradouro,
        numero: enderecoBanco.numero,
        bairro: enderecoBanco.bairro,
        cidade: enderecoBanco.cidade,
        uf: enderecoBanco.uf,
      };

  // Renderizado num portal direto no body: a seção "Revisão" que hospeda
  // este modal recebe uma animação de entrada (Anime.js, translateY) que
  // deixa um transform inline no elemento — isso cria um novo containing
  // block pra descendentes "fixed", prendendo o modal na caixa da seção
  // em vez de cobrir a viewport inteira. O portal escapa dessa árvore.
  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md sm:py-10"
    >
      <div
        ref={painelRef}
        className="border-border bg-card flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-3xl border shadow-2xl shadow-black/40"
      >
        <div className="border-border flex items-center justify-between border-b px-6 py-4 sm:px-8">
          <h2 className="text-foreground text-lg font-semibold">Revisar cadastro</h2>
          <button
            type="button"
            onClick={handleFechar}
            disabled={isSubmitting}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5 sm:px-8">
          <p className="text-muted-foreground text-sm">
            Confira todas as informações antes de enviar. Use &ldquo;Editar&rdquo; em cada seção
            para ajustar algo direto aqui. Se estiver tudo certo, o contrato já é gerado e enviado
            por e-mail para cada sócio assinar; caso contrário, um analista faz uma revisão manual e
            entra em contato.
          </p>

          <section className="flex flex-col gap-3">
            <CabecalhoSecao
              titulo="Empresa"
              editando={editandoEmpresa}
              onToggle={() => setEditandoEmpresa((atual) => !atual)}
            />

            <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">CNPJ</dt>
                <dd className="text-foreground font-medium break-words">{cnpj || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Razão Social</dt>
                <dd className="text-foreground font-medium break-words">{razaoSocial || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contrato Social</dt>
                <dd className="text-foreground font-medium break-words">
                  {contratoSocial?.name ?? "Não anexado"}
                </dd>
              </div>
              {editandoEmpresa ? null : (
                <div>
                  <dt className="text-muted-foreground">Telefone Comercial</dt>
                  <dd className="text-foreground font-medium break-words">
                    {semTelefoneComercial
                      ? "Não possui"
                      : telefoneFormatado(telefoneComercial, telefoneComercialPais)}
                  </dd>
                </div>
              )}
              {editandoEmpresa ? null : (
                <>
                  <div>
                    <dt className="text-muted-foreground">E-mail Operacional</dt>
                    <dd className="text-foreground font-medium break-words">
                      {emailOperacional || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">E-mail Comercial</dt>
                    <dd className="text-foreground font-medium break-words">
                      {emailComercial || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">E-mail Financeiro</dt>
                    <dd className="text-foreground font-medium break-words">
                      {emailFinanceiro || "—"}
                    </dd>
                  </div>
                </>
              )}
            </dl>

            {editandoEmpresa ? (
              <div className="border-border/60 bg-background/40 rounded-2xl border p-4">
                <Passo2Empresa {...props} />
              </div>
            ) : null}
          </section>

          <section className="flex flex-col gap-3">
            <CabecalhoSecao
              titulo="Sócios"
              editando={editandoSocios}
              onToggle={() => setEditandoSocios((atual) => !atual)}
            />

            {editandoSocios ? (
              <div className="flex flex-col gap-3">
                {socios.map((socio, index) => (
                  <SocioWizardCard
                    key={index}
                    index={index}
                    socio={socio}
                    validacao={sociosValidacao[index]!}
                    analiseIdentificacao={
                      sociosAnaliseIdentificacao[index] ?? ANALISE_IDENTIFICACAO_VAZIA
                    }
                    podeRemover={false}
                    cepBuscando={socioCepBuscando === index}
                    onUpdate={(patch) => updateSocio(index, patch)}
                    onRemove={() => {}}
                    onToggleRepresentante={() => toggleRepresentante(index)}
                    onBuscarCep={() => void buscarCepSocio(index)}
                  />
                ))}
              </div>
            ) : (
              socios.map((socio, index) => (
                <div
                  key={index}
                  className="border-border bg-muted/40 flex flex-col gap-1.5 rounded-2xl border px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-foreground min-w-0 truncate font-semibold">
                      {socio.nome || `Sócio ${index + 1}`}
                    </span>
                    {socio.isRepresentante ? (
                      <span className="bg-primary/15 text-primary shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium">
                        Representante legal
                      </span>
                    ) : null}
                  </div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">CPF</dt>
                      <dd className="text-foreground break-words">{socio.cpf || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">E-mail</dt>
                      <dd className="text-foreground break-words">{socio.email || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Telefone</dt>
                      <dd className="text-foreground break-words">
                        {telefoneFormatado(socio.telefone, socio.telefonePais)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Estado Civil</dt>
                      <dd className="text-foreground break-words">
                        {labelEstadoCivil(socio.estadoCivil)}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Endereço</dt>
                      <dd className="text-foreground break-words">
                        {socio.logradouro
                          ? `${socio.logradouro}, ${socio.numero || "s/n"} — ${socio.bairro}, ${socio.cidade}/${socio.uf}`
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))
            )}
          </section>

          <section className="flex flex-col gap-3">
            <CabecalhoSecao
              titulo="Endereço"
              editando={editandoEndereco}
              onToggle={() => setEditandoEndereco((atual) => !atual)}
            />

            {editandoEndereco ? (
              <div className="border-border/60 bg-background/40 rounded-2xl border p-4">
                <Passo6Endereco {...props} />
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Endereço da Agência</dt>
                  <dd className="text-foreground font-medium break-words">
                    {enderecoAgencia.logradouro
                      ? `${enderecoAgencia.logradouro}, ${enderecoAgencia.numero || "s/n"} — ${enderecoAgencia.bairro}, ${enderecoAgencia.cidade}/${enderecoAgencia.uf}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <CabecalhoSecao
              titulo="Banco"
              editando={editandoBanco}
              onToggle={() => setEditandoBanco((atual) => !atual)}
            />

            {editandoBanco ? (
              <div className="border-border/60 bg-background/40 rounded-2xl border p-4">
                <Passo7Banco {...props} />
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Banco</dt>
                  <dd className="text-foreground font-medium break-words">
                    {enderecoBanco.bancoNome
                      ? enderecoBanco.bancoCodigo
                        ? `${enderecoBanco.bancoCodigo} - ${enderecoBanco.bancoNome}`
                        : enderecoBanco.bancoNome
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tipo de Conta</dt>
                  <dd className="text-foreground font-medium break-words">
                    {enderecoBanco.tipoConta || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Agência</dt>
                  <dd className="text-foreground font-medium break-words">
                    {enderecoBanco.bancoAgencia || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Conta</dt>
                  <dd className="text-foreground font-medium break-words">
                    {enderecoBanco.bancoConta || "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Favorecido</dt>
                  <dd className="text-foreground font-medium break-words">
                    {enderecoBanco.favorecidoNome || "—"} — {enderecoBanco.favorecidoDoc || "—"}
                  </dd>
                </div>
              </dl>
            )}
          </section>

          <label className="text-foreground flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={aceite}
              onChange={(event) => setAceite(event.target.checked)}
              className="mt-0.5"
            />
            Li e confirmo que todas as informações acima estão corretas.
          </label>
        </div>

        <div className="border-border flex flex-col gap-3 border-t px-6 py-4 sm:px-8">
          {submitError ? <p className="text-destructive text-sm">{submitError}</p> : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleFechar}
              disabled={isSubmitting}
              className="border-input text-foreground hover:bg-accent rounded-full border px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Voltar e editar
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!aceite || isSubmitting || editandoAlgo}
              title={
                editandoAlgo ? "Conclua a edição das seções abertas antes de enviar." : undefined
              }
              className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
