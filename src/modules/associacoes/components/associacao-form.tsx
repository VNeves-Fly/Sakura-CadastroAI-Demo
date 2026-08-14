"use client";

import { useState, type FormEvent } from "react";
import type {
  AssociacaoFormValues,
  AssociacaoView,
} from "@/modules/associacoes/types/associacao.types";

interface AssociacaoFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: AssociacaoFormValues) => Promise<boolean>;
  associacaoAtual?: AssociacaoView;
  submitLabel?: string;
}

const inputClassName =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

const VALORES_VAZIOS: AssociacaoFormValues = { nome: "", ativo: true };

function paraValoresIniciais(associacao?: AssociacaoView): AssociacaoFormValues {
  if (!associacao) return VALORES_VAZIOS;
  return { nome: associacao.nome, ativo: associacao.ativo };
}

export function AssociacaoForm({
  isSubmitting,
  error,
  onSubmit,
  associacaoAtual,
  submitLabel,
}: AssociacaoFormProps) {
  const [values, setValues] = useState<AssociacaoFormValues>(() =>
    paraValoresIniciais(associacaoAtual),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = await onSubmit(values);
    if (succeeded && !associacaoAtual) {
      setValues(VALORES_VAZIOS);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-card flex flex-col gap-4 rounded-[1.5rem] border p-6 shadow-sm"
    >
      <h2 className="text-foreground text-sm font-semibold">
        {associacaoAtual ? "Editar associação" : "Nova associação"}
      </h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="text-foreground text-sm font-medium">
          Nome
        </label>
        <input
          id="nome"
          type="text"
          required
          placeholder="Nome da associação"
          value={values.nome}
          onChange={(event) => setValues({ ...values, nome: event.target.value })}
          className={inputClassName}
        />
      </div>

      <label className="text-foreground flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.ativo}
          onChange={(event) => setValues({ ...values, ativo: event.target.checked })}
          className="border-input accent-primary size-4 rounded"
        />
        Ativa
      </label>

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
