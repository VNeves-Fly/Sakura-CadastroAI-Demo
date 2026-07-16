"use client";

import { useState } from "react";
import { paisTelefonePorCodigo } from "@/modules/shared/utils/telefone.util";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import type { useCadastroWizardViewModel } from "@/modules/cadastro/view-models/use-cadastro-wizard.view-model";

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

// Modal de revisão final: mostra tudo que o usuário preencheu nas 3
// seções anteriores + um aceite explícito. Só ao confirmar o aceite e
// clicar em "Criar Contrato" é que o submit real acontece (gera e envia
// o contrato pelo D4Sign, no mesmo request que salva o cadastro).
export function RevisaoContratoModal({
  aberto,
  onFechar,
  cnpj,
  qsaResult,
  contratoSocial,
  telefoneComercial,
  telefoneComercialPais,
  semTelefoneComercial,
  emailOperacional,
  emailComercial,
  emailFinanceiro,
  socios,
  enderecoBanco,
  isSubmitting,
  submitError,
  submit,
}: RevisaoContratoModalProps) {
  const [aceite, setAceite] = useState(false);

  if (!aberto) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Revisar cadastro</h2>
          <button
            type="button"
            onClick={onFechar}
            disabled={isSubmitting}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
          <p className="text-sm text-muted-foreground">
            Confira todas as informações antes de gerar o contrato. Depois de confirmado, o contrato
            é enviado por e-mail para cada sócio assinar.
          </p>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Empresa
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">CNPJ</dt>
                <dd className="break-words font-medium text-foreground">{cnpj || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Razão Social</dt>
                <dd className="break-words font-medium text-foreground">
                  {qsaResult?.razaoSocial ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contrato Social</dt>
                <dd className="break-words font-medium text-foreground">
                  {contratoSocial?.name ?? "Não anexado"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Telefone Comercial</dt>
                <dd className="break-words font-medium text-foreground">
                  {semTelefoneComercial
                    ? "Não possui"
                    : telefoneFormatado(telefoneComercial, telefoneComercialPais)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail Operacional</dt>
                <dd className="break-words font-medium text-foreground">
                  {emailOperacional || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail Comercial</dt>
                <dd className="break-words font-medium text-foreground">{emailComercial || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail Financeiro</dt>
                <dd className="break-words font-medium text-foreground">
                  {emailFinanceiro || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Sócios
            </h3>
            {socios.map((socio, index) => (
              <div
                key={index}
                className="flex flex-col gap-1.5 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="min-w-0 truncate font-semibold text-foreground">
                    {socio.nome || `Sócio ${index + 1}`}
                  </span>
                  {socio.isRepresentante ? (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Representante legal
                    </span>
                  ) : null}
                </div>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">CPF</dt>
                    <dd className="break-words text-foreground">{socio.cpf || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">E-mail</dt>
                    <dd className="break-words text-foreground">{socio.email || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Telefone</dt>
                    <dd className="break-words text-foreground">
                      {telefoneFormatado(socio.telefone, socio.telefonePais)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Estado Civil</dt>
                    <dd className="break-words text-foreground">
                      {labelEstadoCivil(socio.estadoCivil)}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Endereço</dt>
                    <dd className="break-words text-foreground">
                      {socio.logradouro
                        ? `${socio.logradouro}, ${socio.numero || "s/n"} — ${socio.bairro}, ${socio.cidade}/${socio.uf}`
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Endereço & Banco
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Endereço da Agência</dt>
                <dd className="break-words font-medium text-foreground">
                  {enderecoAgencia.logradouro
                    ? `${enderecoAgencia.logradouro}, ${enderecoAgencia.numero || "s/n"} — ${enderecoAgencia.bairro}, ${enderecoAgencia.cidade}/${enderecoAgencia.uf}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Banco</dt>
                <dd className="break-words font-medium text-foreground">
                  {enderecoBanco.bancoNome || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tipo de Conta</dt>
                <dd className="break-words font-medium text-foreground">
                  {enderecoBanco.tipoConta || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Agência</dt>
                <dd className="break-words font-medium text-foreground">
                  {enderecoBanco.bancoAgencia || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Conta</dt>
                <dd className="break-words font-medium text-foreground">
                  {enderecoBanco.bancoConta || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Favorecido</dt>
                <dd className="break-words font-medium text-foreground">
                  {enderecoBanco.favorecidoNome || "—"} — {enderecoBanco.favorecidoDoc || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <label className="flex items-start gap-2.5 text-sm text-foreground">
            <input
              type="checkbox"
              checked={aceite}
              onChange={(event) => setAceite(event.target.checked)}
              className="mt-0.5"
            />
            Li e confirmo que todas as informações acima estão corretas.
          </label>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onFechar}
            disabled={isSubmitting}
            className="rounded-full border border-input px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar e editar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!aceite || isSubmitting}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-sakura-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Gerando contrato..." : "Criar Contrato"}
          </button>
        </div>
      </div>
    </div>
  );
}
