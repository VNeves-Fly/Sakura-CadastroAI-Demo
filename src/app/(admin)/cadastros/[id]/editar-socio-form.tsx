"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { SwipeSwitch } from "./swipe-switch";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import type { RepresentanteLegalDetalhe } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { HistoricoEdicaoCadastro } from "@/modules/cadastro/domain/entities/historico-edicao-cadastro.entity";
import { formatarData } from "@/modules/admin/components/dossie-campos";

interface EditarSocioFormProps {
  agenciaId: string;
  socio: RepresentanteLegalDetalhe;
  historico: HistoricoEdicaoCadastro[];
  editarSocioAction: (
    agenciaId: string,
    representanteLegalId: string,
    formData: FormData,
  ) => Promise<void>;
  disabled?: boolean;
}

const LABEL_CAMPO: Record<string, string> = {
  nome: "Nome",
  cpf: "CPF",
  email: "E-mail",
  telefone: "Telefone",
  estadoCivil: "Estado civil",
  nacionalidade: "Nacionalidade",
  rg: "RG",
  rgOrgaoEmissor: "Órgão emissor do RG",
  dataNascimento: "Data de nascimento",
  administrativo: "Assina o contrato",
};

const INPUT_CLASSES =
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2";

function dataParaInput(data: Date | null): string {
  return data ? data.toISOString().slice(0, 10) : "";
}

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

// Edição em lote dos dados do sócio (ver AtualizarRepresentanteLegalUseCase)
// — substitui o antigo SocioAdministrativoToggle isolado: "Assina o
// contrato" agora é só mais um campo deste form, exigindo a mesma
// justificativa obrigatória que os demais (decisão do usuário,
// 2026-07-26).
export function EditarSocioForm({
  agenciaId,
  socio,
  historico,
  editarSocioAction,
  disabled = false,
}: EditarSocioFormProps) {
  const [aberto, setAberto] = useState(false);
  const [assina, setAssina] = useState(socio.administrativo !== false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={disabled}
        className="border-input text-foreground hover:bg-accent rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Editar
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
                Editar sócio — {socio.nome}
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
                await editarSocioAction(agenciaId, socio.id, formData);
                setAberto(false);
              }}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CampoForm label="Nome">
                  <input name="nome" defaultValue={socio.nome} required className={INPUT_CLASSES} />
                </CampoForm>
                <CampoForm label="CPF">
                  <input name="cpf" defaultValue={socio.cpf} required className={INPUT_CLASSES} />
                </CampoForm>
                <CampoForm label="E-mail">
                  <input
                    name="email"
                    type="email"
                    defaultValue={socio.email}
                    required
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="Telefone">
                  <input
                    name="telefone"
                    defaultValue={socio.telefone}
                    required
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="Estado civil">
                  <select
                    name="estadoCivil"
                    defaultValue={socio.estadoCivil}
                    required
                    className={INPUT_CLASSES}
                  >
                    {ESTADO_CIVIL_OPCOES.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </CampoForm>
                <CampoForm label="Nacionalidade">
                  <input
                    name="nacionalidade"
                    defaultValue={socio.nacionalidade ?? ""}
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="RG">
                  <input name="rg" defaultValue={socio.rgNumero ?? ""} className={INPUT_CLASSES} />
                </CampoForm>
                <CampoForm label="Órgão emissor do RG">
                  <input
                    name="rgOrgaoEmissor"
                    defaultValue={socio.rgOrgaoEmissor ?? ""}
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
                <CampoForm label="Data de nascimento">
                  <input
                    name="dataNascimento"
                    type="date"
                    defaultValue={dataParaInput(socio.dataNascimento)}
                    className={INPUT_CLASSES}
                  />
                </CampoForm>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-medium">Assina o contrato</span>
                <SwipeSwitch
                  checked={assina}
                  onChange={setAssina}
                  id={`administrativo-form-${socio.id}`}
                />
                <input type="hidden" name="administrativo" value={assina ? "true" : "false"} />
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
