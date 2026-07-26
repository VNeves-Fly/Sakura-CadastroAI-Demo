"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";

import { cn } from "@/lib/utils";
import { SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import {
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxValue,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipRemove,
} from "@/components/ui/combobox";

export interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldSharedProps {
  /** Lista de opções disponíveis pra seleção. */
  options: SelectFieldOption[];
  /** Nome do campo — quando presente, renderiza input(s) escondido(s) pra submissão em `<form>` nativo. */
  name?: string;
  id?: string;
  placeholder?: string;
  emptyMessage?: string;
  /** Habilita digitação pra filtrar as opções (vira um autocomplete). */
  searchable?: boolean;
  /** Permite adicionar uma opção que não existe na lista (implica `searchable`). */
  creatable?: boolean;
  disabled?: boolean;
  className?: string;
}

interface SelectFieldSingleProps extends SelectFieldSharedProps {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

interface SelectFieldMultipleProps extends SelectFieldSharedProps {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type SelectFieldProps = SelectFieldSingleProps | SelectFieldMultipleProps;

type OpcaoInterna = SelectFieldOption & { criar?: boolean };

// Mesma altura/cor em toda a família select/combobox/creatable — resolve o
// campo cinza + alturas inconsistentes de um `<select>` nativo (o browser
// aplica o próprio "chrome" por cima do CSS a menos que o controle seja
// totalmente customizado, que é o que esses primitivos do base-ui já fazem).
const campoClassName =
  "bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border py-2 text-sm outline-none focus:ring-2";

function encontrarOpcao(
  lista: OpcaoInterna[],
  valor: string | null | undefined,
): OpcaoInterna | null {
  if (!valor) return null;
  return lista.find((opcao) => opcao.value === valor) ?? null;
}

function encontrarOpcoes(lista: OpcaoInterna[], valores: string[] | undefined): OpcaoInterna[] {
  if (!valores?.length) return [];
  return valores
    .map((valor) => encontrarOpcao(lista, valor))
    .filter((opcao): opcao is OpcaoInterna => opcao !== null);
}

const opcoesIguais = (a: OpcaoInterna, b: OpcaoInterna) => a.value === b.value;

/**
 * Campo de seleção padronizado do sistema — cobre os quatro eixos que os
 * filtros/formulários do app precisam: lista + rótulo de exibição, single ou
 * multiple, com ou sem busca (autocomplete) e com ou sem criação de opção
 * nova. Renderiza sobre `Select` (fechado) ou `Combobox` (buscável) do
 * base-ui conforme `searchable`/`creatable`, sempre com a mesma altura/cor.
 */
export function SelectField(props: SelectFieldProps) {
  const {
    options,
    name,
    id,
    placeholder = "Selecione",
    emptyMessage = "Nenhuma opção encontrada.",
    creatable = false,
    disabled,
    className,
  } = props;
  // Criar opção nova exige um campo de texto pra digitar o valor — não tem
  // como oferecer isso num select fechado.
  const searchable = (props.searchable ?? false) || creatable;

  const [criadas, setCriadas] = React.useState<OpcaoInterna[]>([]);
  const [textoBusca, setTextoBusca] = React.useState("");

  const todasOpcoes = React.useMemo<OpcaoInterna[]>(() => {
    const vistos = new Set(options.map((opcao) => opcao.value));
    return [...options, ...criadas.filter((opcao) => !vistos.has(opcao.value))];
  }, [options, criadas]);

  const textoAparado = textoBusca.trim();
  const jaExisteOpcao = todasOpcoes.some(
    (opcao) => opcao.label.localeCompare(textoAparado, "pt-BR", { sensitivity: "base" }) === 0,
  );
  const opcaoCriar: OpcaoInterna | null =
    creatable && textoAparado !== "" && !jaExisteOpcao
      ? { value: textoAparado, label: textoAparado, criar: true }
      : null;
  const itensExibidos = opcaoCriar ? [...todasOpcoes, opcaoCriar] : todasOpcoes;

  function tratarSelecaoCriada(selecionado: OpcaoInterna | OpcaoInterna[] | null) {
    if (!opcaoCriar) return;
    const criouAgora = Array.isArray(selecionado)
      ? selecionado.some((opcao) => opcao.value === opcaoCriar.value)
      : selecionado?.value === opcaoCriar.value;
    if (criouAgora) {
      setCriadas((atual) => [...atual, { value: opcaoCriar.value, label: opcaoCriar.label }]);
    }
  }

  function renderOpcao(opcao: OpcaoInterna) {
    return (
      <span className={opcao.criar ? "text-primary font-medium" : undefined}>
        {opcao.criar ? `Criar "${opcao.label}"` : opcao.label}
      </span>
    );
  }

  if (props.multiple) {
    const onValueChangeMultiple = props.onValueChange;
    const valorControlado =
      props.value !== undefined ? encontrarOpcoes(todasOpcoes, props.value) : undefined;
    const valorPadrao =
      props.value === undefined ? encontrarOpcoes(todasOpcoes, props.defaultValue) : undefined;

    if (searchable) {
      return (
        <ComboboxPrimitive.Root<OpcaoInterna, true>
          items={itensExibidos}
          multiple
          name={name}
          disabled={disabled}
          value={valorControlado}
          defaultValue={valorPadrao}
          inputValue={textoBusca}
          onInputValueChange={setTextoBusca}
          isItemEqualToValue={opcoesIguais}
          onValueChange={(selecionado) => {
            tratarSelecaoCriada(selecionado);
            setTextoBusca("");
            const limpo = selecionado.filter((opcao) => !opcao.criar);
            onValueChangeMultiple?.(limpo.map((opcao) => opcao.value));
          }}
        >
          <ComboboxInputGroup className={cn(campoClassName, "flex-wrap py-1", className)}>
            <ComboboxChips className="pl-3">
              <ComboboxValue>
                {(selecionados: OpcaoInterna[]) => (
                  <>
                    {selecionados.map((opcao) => (
                      <ComboboxChip key={opcao.value} aria-label={opcao.label}>
                        {opcao.label}
                        <ComboboxChipRemove aria-label={`Remover ${opcao.label}`} />
                      </ComboboxChip>
                    ))}
                    <ComboboxPrimitive.Input
                      id={id}
                      autoComplete="off"
                      placeholder={selecionados.length === 0 ? placeholder : undefined}
                      className="text-foreground placeholder:text-muted-foreground min-w-[8ch] flex-1 bg-transparent py-1 text-sm outline-none"
                    />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>
          </ComboboxInputGroup>
          <ComboboxContent emptyMessage={emptyMessage}>
            {(opcao: OpcaoInterna) => (
              <ComboboxItem key={opcao.value} value={opcao}>
                {renderOpcao(opcao)}
              </ComboboxItem>
            )}
          </ComboboxContent>
        </ComboboxPrimitive.Root>
      );
    }

    return (
      <SelectPrimitive.Root<OpcaoInterna, true>
        items={todasOpcoes}
        multiple
        name={name}
        disabled={disabled}
        value={valorControlado}
        defaultValue={valorPadrao}
        isItemEqualToValue={opcoesIguais}
        onValueChange={(selecionado) => {
          onValueChangeMultiple?.(selecionado.map((opcao) => opcao.value));
        }}
      >
        <SelectTrigger id={id} className={cn(campoClassName, "px-4", className)}>
          <SelectPrimitive.Value placeholder={placeholder}>
            {(selecionados: OpcaoInterna[]) =>
              selecionados.length > 0
                ? selecionados.map((opcao) => opcao.label).join(", ")
                : placeholder
            }
          </SelectPrimitive.Value>
        </SelectTrigger>
        <SelectContent>
          {todasOpcoes.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao}>
              {opcao.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPrimitive.Root>
    );
  }

  const onValueChangeSingle = props.onValueChange;
  const valorControlado =
    props.value !== undefined ? encontrarOpcao(todasOpcoes, props.value) : undefined;
  const valorPadrao =
    props.value === undefined ? encontrarOpcao(todasOpcoes, props.defaultValue) : undefined;

  if (searchable) {
    return (
      <ComboboxPrimitive.Root<OpcaoInterna>
        items={itensExibidos}
        name={name}
        disabled={disabled}
        value={valorControlado}
        defaultValue={valorPadrao}
        inputValue={textoBusca}
        onInputValueChange={setTextoBusca}
        isItemEqualToValue={opcoesIguais}
        onValueChange={(selecionado) => {
          tratarSelecaoCriada(selecionado);
          setTextoBusca("");
          onValueChangeSingle?.(selecionado?.value ?? null);
        }}
      >
        <ComboboxInputGroup>
          <ComboboxInput
            id={id}
            placeholder={placeholder}
            autoComplete="off"
            className={cn(campoClassName, className)}
          />
        </ComboboxInputGroup>
        <ComboboxContent emptyMessage={emptyMessage}>
          {(opcao: OpcaoInterna) => (
            <ComboboxItem key={opcao.value} value={opcao}>
              {renderOpcao(opcao)}
            </ComboboxItem>
          )}
        </ComboboxContent>
      </ComboboxPrimitive.Root>
    );
  }

  return (
    <SelectPrimitive.Root<OpcaoInterna>
      items={todasOpcoes}
      name={name}
      disabled={disabled}
      value={valorControlado}
      defaultValue={valorPadrao}
      isItemEqualToValue={opcoesIguais}
      onValueChange={(selecionado) => {
        onValueChangeSingle?.(selecionado?.value ?? null);
      }}
    >
      <SelectTrigger id={id} className={cn(campoClassName, "px-4", className)}>
        <SelectPrimitive.Value placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {todasOpcoes.map((opcao) => (
          <SelectItem key={opcao.value} value={opcao}>
            {opcao.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive.Root>
  );
}
