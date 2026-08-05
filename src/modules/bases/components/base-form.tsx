"use client";

import { useState, type FormEvent } from "react";
import type { BaseFormValues, BaseView } from "@/modules/bases/types/base.types";

interface BaseFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: BaseFormValues) => Promise<boolean>;
  baseAtual?: BaseView;
  submitLabel?: string;
}

const inputClassName =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

const VALORES_VAZIOS: BaseFormValues = { sigla: "", nomeCidade: "", uf: "" };

function paraValoresIniciais(base?: BaseView): BaseFormValues {
  if (!base) return VALORES_VAZIOS;
  return { sigla: base.sigla, nomeCidade: base.nomeCidade, uf: base.uf };
}

export function BaseForm({ isSubmitting, error, onSubmit, baseAtual, submitLabel }: BaseFormProps) {
  const [values, setValues] = useState<BaseFormValues>(() => paraValoresIniciais(baseAtual));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = await onSubmit(values);
    if (succeeded && !baseAtual) {
      setValues(VALORES_VAZIOS);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-card flex flex-col gap-4 rounded-[1.5rem] border p-6 shadow-sm"
    >
      <h2 className="text-foreground text-sm font-semibold">
        {baseAtual ? "Editar base" : "Nova base"}
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="sigla" className="text-foreground text-sm font-medium">
            Sigla
          </label>
          <input
            id="sigla"
            type="text"
            required
            maxLength={4}
            placeholder="RAO"
            value={values.sigla}
            onChange={(event) => setValues({ ...values, sigla: event.target.value })}
            className={`${inputClassName} uppercase`}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="nomeCidade" className="text-foreground text-sm font-medium">
            Cidade
          </label>
          <input
            id="nomeCidade"
            type="text"
            required
            placeholder="Ribeirão Preto"
            value={values.nomeCidade}
            onChange={(event) => setValues({ ...values, nomeCidade: event.target.value })}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 sm:w-24">
        <label htmlFor="uf" className="text-foreground text-sm font-medium">
          UF
        </label>
        <input
          id="uf"
          type="text"
          required
          maxLength={2}
          placeholder="SP"
          value={values.uf}
          onChange={(event) => setValues({ ...values, uf: event.target.value })}
          className={`${inputClassName} uppercase`}
        />
      </div>

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
