"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { CadastroComplementarDetalhe } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { DadosReceita } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type { HistoricoEdicaoCadastro } from "@/modules/cadastro/domain/entities/historico-edicao-cadastro.entity";
import { formatarData } from "@/modules/admin/utils/dossie-campos.util";

interface EditarEmpresaFormProps {
  agenciaId: string;
  agencia: Agencia;
  complementar: CadastroComplementarDetalhe;
  dadosReceita: DadosReceita | null;
  historico: HistoricoEdicaoCadastro[];
  editarEmpresaAction: (agenciaId: string, formData: FormData) => Promise<void>;
  disabled?: boolean;
}

const LABEL_CAMPO: Record<string, string> = {
  razaoSocial: "Razão social",
  nomeFantasia: "Nome fantasia",
  emailContato: "E-mail de contato",
  telefoneContato: "Telefone de contato",
  telefoneComercial: "Telefone comercial",
  emailOperacional: "E-mail operacional",
  emailComercial: "E-mail comercial",
  emailFinanceiro: "E-mail financeiro",
  cep: "CEP",
  logradouro: "Logradouro",
  numero: "Número",
  complemento: "Complemento",
  bairro: "Bairro",
  cidade: "Cidade",
  uf: "UF",
};

const INPUT_CLASSES =
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2";

function CampoForm({
  label,
  oficial,
  children,
}: {
  label: string;
  oficial?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
        {label}
      </span>
      {children}
      {oficial ? (
        <span className="text-muted-foreground text-xs">
          Oficial (Receita): <span className="font-medium">{oficial}</span>
        </span>
      ) : null}
    </label>
  );
}

// Edição em lote dos dados "de cadastro" da empresa (ver
// EditarDadosEmpresaUseCase) — toca Agencia e CadastroComplementar na
// mesma chamada. Campos com equivalente em DadosReceita mostram o valor
// oficial ao lado, somente leitura — nunca editável por aqui (a Receita é
// fonte externa, ver `oficial` em CampoForm, mesma linguagem visual de
// ComparacaoOficialDetalhe em dossie-campos.tsx).
export function EditarEmpresaForm({
  agenciaId,
  agencia,
  complementar,
  dadosReceita,
  historico,
  editarEmpresaAction,
  disabled = false,
}: EditarEmpresaFormProps) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={disabled}
        className="border-input text-foreground hover:bg-accent rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Editar dados da empresa
      </button>

      {aberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className="bg-card flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
              <span className="text-foreground min-w-0 truncate text-sm font-semibold">
                Editar dados da empresa
              </span>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full p-1 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await editarEmpresaAction(agenciaId, formData);
                setAberto(false);
              }}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CampoForm label="Razão social">
                  <input
                    name="razaoSocial"
                    defaultValue={agencia.razaoSocial}
                    required
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="Nome fantasia">
                  <input
                    name="nomeFantasia"
                    defaultValue={agencia.nomeFantasia ?? ""}
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="E-mail de contato" oficial={dadosReceita?.email}>
                  <input
                    name="emailContato"
                    type="email"
                    defaultValue={agencia.emailContato}
                    required
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="Telefone de contato" oficial={dadosReceita?.telefone}>
                  <input
                    name="telefoneContato"
                    defaultValue={agencia.telefoneContato}
                    required
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="Telefone comercial">
                  <input
                    name="telefoneComercial"
                    defaultValue={complementar.telefoneComercial ?? ""}
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="E-mail operacional">
                  <input
                    name="emailOperacional"
                    type="email"
                    defaultValue={complementar.emailOperacional ?? ""}
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="E-mail comercial">
                  <input
                    name="emailComercial"
                    type="email"
                    defaultValue={complementar.emailComercial ?? ""}
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="E-mail financeiro">
                  <input
                    name="emailFinanceiro"
                    type="email"
                    defaultValue={complementar.emailFinanceiro ?? ""}
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
              </div>

              <div className="border-border bg-muted/20 flex flex-col gap-3 rounded-2xl border p-3">
                <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                  Endereço da empresa
                </span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CampoForm label="CEP">
                    <input
                      name="cep"
                      defaultValue={complementar.enderecoAgencia.cep}
                      className={INPUT_CLASSES}
                    />
                  </CampoForm>
                  <CampoForm label="Logradouro">
                    <input
                      name="logradouro"
                      defaultValue={complementar.enderecoAgencia.logradouro}
                      className={INPUT_CLASSES}
                    />
                  </CampoForm>
                  <CampoForm label="Número">
                    <input
                      name="numero"
                      defaultValue={complementar.enderecoAgencia.numero}
                      className={INPUT_CLASSES}
                    />
                  </CampoForm>
                  <CampoForm label="Complemento">
                    <input
                      name="complemento"
                      defaultValue={complementar.enderecoAgencia.complemento}
                      className={INPUT_CLASSES}
                    />
                  </CampoForm>
                  <CampoForm label="Bairro">
                    <input
                      name="bairro"
                      defaultValue={complementar.enderecoAgencia.bairro}
                      className={INPUT_CLASSES}
                    />
                  </CampoForm>
                  <CampoForm label="Cidade">
                    <input
                      name="cidade"
                      defaultValue={complementar.enderecoAgencia.cidade}
                      className={INPUT_CLASSES}
                    />
                  </CampoForm>
                  <CampoForm label="UF">
                    <input
                      name="uf"
                      defaultValue={complementar.enderecoAgencia.uf}
                      className={INPUT_CLASSES}
                    />
                  </CampoForm>
                </div>
              </div>

              <textarea
                name="justificativa"
                required
                rows={2}
                placeholder="Justificativa da edição (obrigatório)"
                className={INPUT_CLASSES}
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="border-input text-foreground hover:bg-accent rounded-full border px-4 py-2 text-sm font-medium transition"
                >
                  Cancelar
                </button>
              </div>

              {historico.length > 0 ? (
                <details className="border-border bg-muted/20 rounded-lg border px-3 py-2 text-xs">
                  <summary className="text-muted-foreground cursor-pointer font-semibold">
                    Ver histórico de edições ({historico.length})
                  </summary>
                  <div className="mt-2 flex flex-col gap-2">
                    {historico.map((item) => (
                      <div
                        key={item.id}
                        className="border-border flex flex-col gap-1 border-t pt-2 first:border-0 first:pt-0"
                      >
                        <span className="text-foreground font-semibold">
                          {item.editadoPor} — {formatarData(item.createdAt)}
                        </span>
                        <span className="text-muted-foreground">{item.justificativa}</span>
                        <ul className="list-inside list-disc">
                          {Object.entries(item.alteracoes).map(([campo, alteracao]) => (
                            <li key={campo}>
                              {LABEL_CAMPO[campo] ?? campo}: {alteracao.de ?? "—"} →{" "}
                              {alteracao.para ?? "—"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
