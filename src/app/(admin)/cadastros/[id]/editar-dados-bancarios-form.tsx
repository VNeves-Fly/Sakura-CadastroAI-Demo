"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { CadastroComplementarDetalhe } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { HistoricoEdicaoCadastro } from "@/modules/cadastro/domain/entities/historico-edicao-cadastro.entity";
import {
  BANCO_PAIS_OPCOES,
  TIPO_CONTA_OPCOES,
} from "@/modules/cadastro/types/endereco-banco.types";
import { formatarData } from "@/modules/admin/utils/dossie-campos.util";

interface EditarDadosBancariosFormProps {
  agenciaId: string;
  complementar: CadastroComplementarDetalhe;
  historico: HistoricoEdicaoCadastro[];
  editarDadosBancariosAction: (agenciaId: string, formData: FormData) => Promise<void>;
  disabled?: boolean;
}

const LABEL_CAMPO: Record<string, string> = {
  bancoPais: "País do banco",
  bancoNome: "Banco",
  bancoCodigo: "Código do banco",
  bancoAgencia: "Agência",
  bancoConta: "Conta",
  bancoSwift: "SWIFT / BIC",
  tipoConta: "Tipo de conta",
  favorecidoEhEmpresa: "Favorecido é a própria empresa",
  favorecidoNome: "Nome do favorecido",
  favorecidoDoc: "CPF/CNPJ do favorecido",
};

const INPUT_CLASSES =
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2";

function CampoForm({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

// Edição dos dados bancários de recebimento (ver EditarDadosBancariosUseCase)
// — só toca CadastroComplementar, mesmo padrão visual/modal de
// EditarEmpresaForm (justificativa obrigatória + histórico de edições).
export function EditarDadosBancariosForm({
  agenciaId,
  complementar,
  historico,
  editarDadosBancariosAction,
  disabled = false,
}: EditarDadosBancariosFormProps) {
  const [aberto, setAberto] = useState(false);
  const [bancoInternacional, setBancoInternacional] = useState(
    complementar.bancoPais === "internacional",
  );
  const [favorecidoEhEmpresa, setFavorecidoEhEmpresa] = useState(
    complementar.favorecidoEhEmpresa ?? false,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={disabled}
        className="border-input text-foreground hover:bg-accent rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Editar dados bancários
      </button>

      {aberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className="bg-card flex h-full max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
              <span className="text-foreground min-w-0 truncate text-sm font-semibold">
                Editar dados bancários
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
                await editarDadosBancariosAction(agenciaId, formData);
                setAberto(false);
              }}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CampoForm label="País do banco">
                  <select
                    name="bancoPais"
                    defaultValue={complementar.bancoPais ?? "nacional"}
                    onChange={(event) =>
                      setBancoInternacional(event.target.value === "internacional")
                    }
                    className={INPUT_CLASSES}
                  >
                    {BANCO_PAIS_OPCOES.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.bandeira} {opcao.label}
                      </option>
                    ))}
                  </select>
                </CampoForm>
                <CampoForm label="Tipo de conta">
                  <select
                    name="tipoConta"
                    defaultValue={complementar.tipoConta ?? ""}
                    className={INPUT_CLASSES}
                  >
                    <option value="">Selecione</option>
                    {TIPO_CONTA_OPCOES.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </CampoForm>
                <CampoForm label="Banco">
                  <input
                    name="bancoNome"
                    defaultValue={complementar.bancoNome ?? ""}
                    required
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="Código do banco">
                  <input
                    name="bancoCodigo"
                    defaultValue={complementar.bancoCodigo ?? ""}
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label={bancoInternacional ? "Routing / Branch Code" : "Agência"}>
                  <input
                    name="bancoAgencia"
                    defaultValue={complementar.bancoAgencia ?? ""}
                    required
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label={bancoInternacional ? "Conta / IBAN" : "Conta (com dígito)"}>
                  <input
                    name="bancoConta"
                    defaultValue={complementar.bancoConta ?? ""}
                    required
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                {bancoInternacional ? (
                  <CampoForm label="SWIFT / BIC">
                    <input
                      name="bancoSwift"
                      defaultValue={complementar.bancoSwift ?? ""}
                      placeholder="Ex: BOFAUS3N"
                      className={INPUT_CLASSES}
                    />
                  </CampoForm>
                ) : null}
              </div>

              <div className="border-border bg-muted/20 flex flex-col gap-3 rounded-2xl border p-3">
                <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
                  Favorecido
                </span>
                <label className="text-foreground flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="favorecidoEhEmpresa"
                    defaultChecked={complementar.favorecidoEhEmpresa ?? false}
                    onChange={(event) => setFavorecidoEhEmpresa(event.target.checked)}
                  />
                  Favorecido é a própria empresa (CNPJ da agência)
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CampoForm label="Nome do favorecido">
                    <input
                      name="favorecidoNome"
                      defaultValue={complementar.favorecidoNome ?? ""}
                      disabled={favorecidoEhEmpresa}
                      required={!favorecidoEhEmpresa}
                      className={INPUT_CLASSES}
                    />
                  </CampoForm>
                  <CampoForm label="CPF/CNPJ do favorecido">
                    <input
                      name="favorecidoDoc"
                      defaultValue={complementar.favorecidoDoc ?? ""}
                      disabled={favorecidoEhEmpresa}
                      required={!favorecidoEhEmpresa}
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
