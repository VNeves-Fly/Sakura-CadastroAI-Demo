"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SwipeSwitch } from "./swipe-switch";
import { ESTADO_CIVIL_OPCOES } from "@/modules/cadastro/types/socio-wizard.types";
import { CampoForm, INPUT_CLASSES } from "./editar-socio-form";

interface NovoSocioFormProps {
  agenciaId: string;
  adicionarSocioAction: (agenciaId: string, formData: FormData) => Promise<void>;
  disabled?: boolean;
}

// Bloco "Adicionar sócio" do dossiê — cria um RepresentanteLegal novo pra
// agência (ver CriarRepresentanteLegalUseCase) já com o documento de
// identificação (opcional, entra pelo mesmo caminho do upload manual do
// dossiê) e a marcação de sócio administrativo/quem assina o contrato,
// num único submit.
export function NovoSocioForm({
  agenciaId,
  adicionarSocioAction,
  disabled = false,
}: NovoSocioFormProps) {
  const [aberto, setAberto] = useState(false);
  const [assina, setAssina] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={disabled}
        className="border-input text-foreground hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-3.5" />
        Adicionar sócio
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
                Adicionar sócio
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
                await adicionarSocioAction(agenciaId, formData);
                setAssina(true);
                setAberto(false);
              }}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CampoForm label="Nome">
                  <input name="nome" required className={INPUT_CLASSES} />
                </CampoForm>
                <CampoForm label="CPF">
                  <input name="cpf" required className={INPUT_CLASSES} />
                </CampoForm>
                <CampoForm label="E-mail">
                  <input name="email" type="email" required className={INPUT_CLASSES} />
                </CampoForm>
                <CampoForm label="Telefone">
                  <input name="telefone" required className={INPUT_CLASSES} />
                </CampoForm>
                <CampoForm label="Estado civil">
                  <select name="estadoCivil" required defaultValue="" className={INPUT_CLASSES}>
                    <option value="" disabled>
                      Selecione
                    </option>
                    {ESTADO_CIVIL_OPCOES.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </CampoForm>
                <CampoForm label="Nacionalidade">
                  <input name="nacionalidade" className={INPUT_CLASSES} />
                </CampoForm>
                <CampoForm label="RG">
                  <input name="rg" className={INPUT_CLASSES} />
                </CampoForm>
                <CampoForm label="Órgão emissor do RG">
                  <input name="rgOrgaoEmissor" className={INPUT_CLASSES} />
                </CampoForm>
                <CampoForm label="Data de nascimento">
                  <input name="dataNascimento" type="date" className={INPUT_CLASSES} />
                </CampoForm>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  Sócio administrativo (assina o contrato)
                </span>
                <SwipeSwitch
                  checked={assina}
                  onChange={setAssina}
                  id={`administrativo-novo-socio`}
                />
                <input type="hidden" name="administrativo" value={assina ? "true" : "false"} />
              </div>

              <CampoForm label="Documento (RG/CNH) — imagem ou PDF">
                <input
                  name="arquivo"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  className={INPUT_CLASSES}
                />
              </CampoForm>

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
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
