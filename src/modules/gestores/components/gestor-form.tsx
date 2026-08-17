"use client";

import { useState, type FormEvent } from "react";
import { CamposAcessoPlataforma } from "@/modules/gestores/components/campos-acesso-plataforma";
import { BaseMultiSelect } from "@/modules/bases/components/base-multi-select";
import { useNivelDoGestor } from "@/modules/gestores/stores/gestor-niveis.store";
import { NIVEIS_GESTOR, nivelSeed } from "@/modules/gestores/types/gestor-nivel.types";
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
  // Usados quando o form é embutido num Dialog (ver gestor-cadastro-modal.tsx)
  // — o modal já traz título/borda/sombra próprios via DialogHeader/DialogContent,
  // então evita duplicar esse chrome.
  className?: string;
  mostrarTitulo?: boolean;
}

const inputClassName =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

const VALORES_VAZIOS: GestorFormValues = {
  nome: "",
  email: "",
  telefone: "",
  baseIds: [],
  nivel: null,
  criarAcesso: false,
  password: "",
  mustChangePassword: false,
  useTemporaryPassword: false,
};

// gestor.bases vem como sigla (view de exibição) — o form trabalha com id
// (o que a API espera), então precisa resolver de volta via basesOptions.
// `nivelInicial` vem de fora (useNivelDoGestor + fallback de seed) porque
// depende de um hook — não dá pra resolver dentro desta função pura.
function paraValoresIniciais(
  gestor: GestorView | undefined,
  basesOptions: BaseView[],
  nivelInicial: GestorFormValues["nivel"],
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
    nivel: nivelInicial,
  };
}

export function GestorForm({
  isSubmitting,
  error,
  onSubmit,
  gestorAtual,
  submitLabel,
  basesOptions,
  className,
  mostrarTitulo = true,
}: GestorFormProps) {
  const nivelDaStore = useNivelDoGestor(gestorAtual?.id ?? "");
  const [values, setValues] = useState<GestorFormValues>(() =>
    paraValoresIniciais(
      gestorAtual,
      basesOptions,
      gestorAtual ? (nivelDaStore ?? nivelSeed(gestorAtual.id)) : null,
    ),
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
      className={
        className ??
        "border-border bg-card flex flex-col gap-4 rounded-[1.5rem] border p-6 shadow-sm"
      }
    >
      {mostrarTitulo ? (
        <h2 className="text-foreground text-sm font-semibold">
          {gestorAtual ? "Editar gestor" : "Novo gestor"}
        </h2>
      ) : null}

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

      <div className="flex flex-col gap-1">
        <label htmlFor="nivel" className="text-foreground text-sm font-medium">
          Nível
        </label>
        <select
          id="nivel"
          required
          value={values.nivel ?? ""}
          onChange={(event) =>
            setValues({ ...values, nivel: event.target.value as GestorFormValues["nivel"] })
          }
          className={inputClassName}
        >
          <option value="" disabled>
            Selecione o nível
          </option>
          {NIVEIS_GESTOR.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.label}
            </option>
          ))}
        </select>
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
