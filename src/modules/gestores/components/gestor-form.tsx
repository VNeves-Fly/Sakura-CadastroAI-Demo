"use client";

import { useState, type FormEvent } from "react";
import { CamposAcessoPlataforma } from "@/modules/gestores/components/campos-acesso-plataforma";
import { BaseMultiSelect } from "@/modules/bases/components/base-multi-select";
import type { BaseView } from "@/modules/bases/types/base.types";
import type { GestorFormValues, GestorView } from "@/modules/gestores/types/gestor.types";

interface GestorFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: GestorFormValues) => Promise<boolean>;
  // Presente = modo edição, pré-preenche os campos.
  gestorAtual?: GestorView;
  submitLabel?: string;
  basesOptions: BaseView[];
}

const inputClassName =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

const VALORES_VAZIOS: GestorFormValues = {
  nome: "",
  email: "",
  telefone: "",
  baseIds: [],
  criarAcesso: false,
  password: "",
  mustChangePassword: false,
  useTemporaryPassword: false,
};

// gestor.bases vem como sigla (view de exibição) — o form trabalha com id
// (o que a API espera), então precisa resolver de volta via basesOptions.
function paraValoresIniciais(
  gestor: GestorView | undefined,
  basesOptions: BaseView[],
): GestorFormValues {
  if (!gestor) return VALORES_VAZIOS;
  const idsPorSigla = new Map(basesOptions.map((base) => [base.sigla, base.id]));
  return {
    ...VALORES_VAZIOS,
    nome: gestor.nome,
    email: gestor.email ?? "",
    telefone: gestor.telefone ?? "",
    baseIds: gestor.bases
      .map((sigla) => idsPorSigla.get(sigla))
      .filter((id): id is string => Boolean(id)),
  };
}

export function GestorForm({
  isSubmitting,
  error,
  onSubmit,
  gestorAtual,
  submitLabel,
  basesOptions,
}: GestorFormProps) {
  const [values, setValues] = useState<GestorFormValues>(() =>
    paraValoresIniciais(gestorAtual, basesOptions),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = await onSubmit(values);
    if (succeeded && !gestorAtual) {
      setValues(VALORES_VAZIOS);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-card flex flex-col gap-4 rounded-[1.5rem] border p-6 shadow-sm"
    >
      <h2 className="text-foreground text-sm font-semibold">
        {gestorAtual ? "Editar gestor" : "Novo gestor"}
      </h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="text-foreground text-sm font-medium">
          Nome completo
        </label>
        <input
          id="nome"
          type="text"
          required
          placeholder="Nome completo"
          value={values.nome}
          onChange={(event) => setValues({ ...values, nome: event.target.value })}
          className={inputClassName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-foreground text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="voce@empresa.com"
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="telefone" className="text-foreground text-sm font-medium">
            Telefone (WhatsApp)
          </label>
          <input
            id="telefone"
            type="tel"
            placeholder="(11) 91234-5678"
            value={values.telefone}
            onChange={(event) => setValues({ ...values, telefone: event.target.value })}
            className={inputClassName}
          />
        </div>
      </div>

      <BaseMultiSelect
        label="Bases atendidas"
        opcoes={basesOptions}
        selecionadas={values.baseIds}
        onChange={(baseIds) => setValues({ ...values, baseIds })}
        vazioLabel="Nenhuma base cadastrada — crie bases em /bases primeiro."
      />

      <CamposAcessoPlataforma
        value={values}
        onChange={(acesso) => setValues({ ...values, ...acesso })}
        jaTemAcesso={gestorAtual?.temAcesso}
      />

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Salvando..." : (submitLabel ?? "Cadastrar")}
      </button>
    </form>
  );
}
