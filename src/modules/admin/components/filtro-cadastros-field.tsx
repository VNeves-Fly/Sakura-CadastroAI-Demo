"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { cn } from "@/lib/utils";
import {
  ComboboxInputGroup,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxItem,
  ComboboxValue,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipRemove,
} from "@/components/ui/combobox";

export interface OpcaoFiltroCadastros {
  // Prefixado por categoria (ex.: "base:SP", "executivo:<id>") — é assim
  // que a categoria sobrevive ao roundtrip de um <form method="GET">
  // nativo, que só serializa o value mesmo.
  value: string;
  label: string;
  categoria: string;
}

const campoClassName =
  "bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border py-2 text-sm outline-none focus:ring-2";

const opcoesIguais = (a: OpcaoFiltroCadastros, b: OpcaoFiltroCadastros) => a.value === b.value;

function encontrarOpcoes(
  lista: OpcaoFiltroCadastros[],
  valores: string[] | undefined,
): OpcaoFiltroCadastros[] {
  if (!valores?.length) return [];
  const porValor = new Map(lista.map((opcao) => [opcao.value, opcao]));
  return valores
    .map((valor) => porValor.get(valor))
    .filter((opcao): opcao is OpcaoFiltroCadastros => opcao !== undefined);
}

// Filtro único de /cadastros (Base, Gestor, Executivo, Associação,
// Status) — um combobox multi-select só, com as opções agrupadas por
// categoria dentro do mesmo dropdown (decisão do usuário, 2026-07-27: em
// vez de um seletor por categoria). A filtragem por texto digitado é
// feita aqui mesmo em JS (não pela filtragem automática do base-ui, que
// só funciona com a render-prop de item único — incompatível com
// agrupar), pra poder decidir quais grupos aparecem.
export function FiltroCadastrosField({
  name,
  options,
  defaultValue,
  placeholder = "Filtrar",
  emptyMessage = "Nenhuma opção encontrada.",
  className,
}: {
  name: string;
  options: OpcaoFiltroCadastros[];
  defaultValue?: string[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const [textoBusca, setTextoBusca] = React.useState("");

  const opcoesFiltradas = React.useMemo(() => {
    const termo = textoBusca.trim().toLowerCase();
    if (!termo) return options;
    return options.filter((opcao) => opcao.label.toLowerCase().includes(termo));
  }, [options, textoBusca]);

  const grupos = React.useMemo(() => {
    const porCategoria = new Map<string, OpcaoFiltroCadastros[]>();
    for (const opcao of opcoesFiltradas) {
      const lista = porCategoria.get(opcao.categoria) ?? [];
      lista.push(opcao);
      porCategoria.set(opcao.categoria, lista);
    }
    return [...porCategoria.entries()];
  }, [opcoesFiltradas]);

  const valorPadrao = encontrarOpcoes(options, defaultValue);

  return (
    <ComboboxPrimitive.Root<OpcaoFiltroCadastros, true>
      items={opcoesFiltradas}
      multiple
      name={name}
      defaultValue={valorPadrao}
      inputValue={textoBusca}
      onInputValueChange={setTextoBusca}
      isItemEqualToValue={opcoesIguais}
      onValueChange={() => setTextoBusca("")}
    >
      <ComboboxInputGroup className={cn(campoClassName, "flex-wrap py-1", className)}>
        <ComboboxChips className="pl-3">
          <ComboboxValue>
            {(selecionados: OpcaoFiltroCadastros[]) => (
              <>
                {selecionados.map((opcao) => (
                  <ComboboxChip key={opcao.value} aria-label={`${opcao.categoria}: ${opcao.label}`}>
                    {opcao.categoria}: {opcao.label}
                    <ComboboxChipRemove aria-label={`Remover ${opcao.label}`} />
                  </ComboboxChip>
                ))}
                <ComboboxPrimitive.Input
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
        {grupos.map(([categoria, itens]) => (
          <ComboboxGroup key={categoria}>
            <ComboboxGroupLabel>{categoria}</ComboboxGroupLabel>
            {itens.map((opcao) => (
              <ComboboxItem key={opcao.value} value={opcao}>
                {opcao.label}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        ))}
      </ComboboxContent>
    </ComboboxPrimitive.Root>
  );
}
