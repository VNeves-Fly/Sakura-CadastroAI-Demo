"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CamposAcessoPlataforma } from "@/modules/gestores/components/campos-acesso-plataforma";
import { BaseMultiSelect } from "@/modules/bases/components/base-multi-select";
import type { BaseView } from "@/modules/bases/types/base.types";
import type {
  GestorOpcao,
  PromotorCrudView,
  PromotorFormValues,
} from "@/modules/atribuicoes/types/promotor-crud.types";

interface PromotorFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: PromotorFormValues) => Promise<boolean>;
  // Presente = modo edição, pré-preenche os campos.
  promotorAtual?: PromotorCrudView;
  submitLabel?: string;
  // null = usuário logado é Gestor (gestorId travado no dele, campo nem
  // aparece); array = Admin/Diretor, escolhe entre todos os Gestores.
  gestoresOptions: GestorOpcao[] | null;
  // Bases do próprio Gestor logado — só usado quando gestoresOptions é null
  // (Gestor não escolhe gestor, mas precisa saber quais bases pode
  // atribuir ao Executivo).
  minhasBasesSiglas?: string[];
  // Catálogo completo de Base, pra resolver sigla <-> id.
  todasBases: BaseView[];
  // Usados quando o form é embutido num Dialog (ver executivo-cadastro-modal.tsx)
  // — o modal já traz título/borda/sombra próprios via DialogHeader/DialogContent,
  // então evita duplicar esse chrome.
  className?: string;
  mostrarTitulo?: boolean;
}

const inputClassName =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

function valoresVazios(gestoresOptions: GestorOpcao[] | null): PromotorFormValues {
  return {
    nome: "",
    sica: "",
    email: "",
    telefone: "",
    gestorId: gestoresOptions?.[0]?.id ?? "",
    baseIds: [],
    criarAcesso: false,
    password: "",
    mustChangePassword: false,
    useTemporaryPassword: false,
  };
}

function paraValoresIniciais(
  promotor: PromotorCrudView | undefined,
  gestoresOptions: GestorOpcao[] | null,
  todasBases: BaseView[],
): PromotorFormValues {
  if (!promotor) return valoresVazios(gestoresOptions);
  const idsPorSigla = new Map(todasBases.map((base) => [base.sigla, base.id]));
  return {
    ...valoresVazios(gestoresOptions),
    nome: promotor.nome,
    sica: promotor.sica !== null ? String(promotor.sica) : "",
    email: promotor.email,
    telefone: promotor.telefone ?? "",
    gestorId: promotor.gestorId ?? gestoresOptions?.[0]?.id ?? "",
    baseIds: promotor.bases
      .map((sigla) => idsPorSigla.get(sigla))
      .filter((id): id is string => Boolean(id)),
  };
}

export function PromotorForm({
  isSubmitting,
  error,
  onSubmit,
  promotorAtual,
  submitLabel,
  gestoresOptions,
  minhasBasesSiglas,
  todasBases,
  className,
  mostrarTitulo = true,
}: PromotorFormProps) {
  const [values, setValues] = useState<PromotorFormValues>(() =>
    paraValoresIniciais(promotorAtual, gestoresOptions, todasBases),
  );

  // Executivo só pode ficar com bases que o próprio Gestor dele atende
  // (controle só no frontend, decisão do usuário 2026-08-04) — filtra as
  // opções conforme o gestorId selecionado (ou o do Gestor logado, quando
  // não há seletor).
  const basesDoGestorSelecionado = useMemo(() => {
    const siglas = gestoresOptions
      ? (gestoresOptions.find((gestor) => gestor.id === values.gestorId)?.bases ?? [])
      : (minhasBasesSiglas ?? []);
    return todasBases.filter((base) => siglas.includes(base.sigla));
  }, [gestoresOptions, minhasBasesSiglas, values.gestorId, todasBases]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = await onSubmit(values);
    if (succeeded && !promotorAtual) {
      setValues(valoresVazios(gestoresOptions));
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
          {promotorAtual ? "Editar executivo" : "Novo executivo"}
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
            required
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="sica" className="text-foreground text-sm font-medium">
            SICA
          </label>
          <input
            id="sica"
            type="number"
            placeholder="Opcional"
            value={values.sica}
            onChange={(event) => setValues({ ...values, sica: event.target.value })}
            className={inputClassName}
          />
        </div>

        {gestoresOptions ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="gestorId" className="text-foreground text-sm font-medium">
              Gestor
            </label>
            <select
              id="gestorId"
              required
              value={values.gestorId}
              onChange={(event) =>
                // Troca de gestor esvazia as bases já marcadas — evita
                // salvar uma base de fora do novo gestor por engano.
                setValues({ ...values, gestorId: event.target.value, baseIds: [] })
              }
              className={inputClassName}
            >
              {gestoresOptions.length === 0 ? (
                <option value="">Nenhum gestor cadastrado</option>
              ) : null}
              {gestoresOptions.map((gestor) => (
                <option key={gestor.id} value={gestor.id}>
                  {gestor.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <BaseMultiSelect
        label="Bases atendidas"
        opcoes={basesDoGestorSelecionado}
        selecionadas={values.baseIds}
        onChange={(baseIds) => setValues({ ...values, baseIds })}
        vazioLabel="O gestor selecionado ainda não tem bases atribuídas."
      />

      <CamposAcessoPlataforma
        value={values}
        onChange={(acesso) => setValues({ ...values, ...acesso })}
        jaTemAcesso={promotorAtual?.temAcesso}
      />

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting || (gestoresOptions !== null && gestoresOptions.length === 0)}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Salvando..." : (submitLabel ?? "Cadastrar")}
      </button>
    </form>
  );
}
