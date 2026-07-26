"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

// Mesma linguagem visual do select.tsx (pill arredondado, popover com
// check indicator) — versão buscável pra listas grandes onde um
// <select> comum obrigaria o usuário a rolar até achar a opção (ex.:
// lista de bancos do Brasil, com centenas de itens).
function Combobox<Value>({ ...props }: ComboboxPrimitive.Root.Props<Value>) {
  return <ComboboxPrimitive.Root data-slot="combobox" {...props} />;
}

function ComboboxInputGroup({ className, ...props }: ComboboxPrimitive.InputGroup.Props) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      className={cn("relative flex items-center", className)}
      {...props}
    />
  );
}

function ComboboxInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <>
      <Search className="text-muted-foreground pointer-events-none absolute left-4 size-4" />
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        className={cn(
          "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border py-2.5 pr-9 pl-10 text-sm outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
      <ChevronDown className="text-muted-foreground pointer-events-none absolute right-4 size-4" />
    </>
  );
}

function ComboboxContent({
  className,
  children,
  emptyMessage = "Nenhum resultado encontrado.",
  sideOffset = 6,
  ...props
}: Omit<ComboboxPrimitive.Popup.Props, "children"> &
  Pick<ComboboxPrimitive.Positioner.Props, "sideOffset" | "align" | "side"> & {
    // Passado direto pro Combobox.List — precisa ser uma função
    // (item, index) => ReactNode pra filtragem funcionar (base-ui só
    // filtra dinamicamente a lista quando os itens são resolvidos via
    // essa forma de "render prop"; children estáticos não são filtrados).
    children: ComboboxPrimitive.List.Props["children"];
    emptyMessage?: React.ReactNode;
  }) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        sideOffset={sideOffset}
        className="isolate z-50"
        {...(props as ComboboxPrimitive.Positioner.Props)}
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "bg-popover text-popover-foreground data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 max-h-(--available-height) w-(--anchor-width) min-w-[8rem] origin-(--transform-origin) overflow-y-auto rounded-2xl border p-1 shadow-lg",
            className,
          )}
        >
          <ComboboxPrimitive.Empty className="text-muted-foreground px-3 py-2 text-sm">
            {emptyMessage}
          </ComboboxPrimitive.Empty>
          <ComboboxPrimitive.List>{children}</ComboboxPrimitive.List>
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "data-highlighted:bg-primary/10 data-highlighted:text-primary relative flex w-full cursor-pointer items-center gap-2 rounded-xl py-2 pr-8 pl-3 text-sm outline-none select-none",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
        <Check className="text-primary size-4" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

// Container das chips (multi-select) — fica dentro do InputGroup, antes do
// Input, pro texto digitado continuar aparecendo depois dos itens já
// selecionados (mesmo padrão da doc do base-ui pro Combobox multiple).
function ComboboxChips({ className, ...props }: ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn("flex min-w-0 flex-1 flex-wrap items-center gap-1 py-1 pl-10", className)}
      {...props}
    />
  );
}

function ComboboxChip({ className, children, ...props }: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "bg-accent text-accent-foreground flex items-center gap-1 rounded-full py-1 pr-1.5 pl-2.5 text-xs font-medium",
        className,
      )}
      {...props}
    >
      {children}
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipRemove({ className, ...props }: ComboboxPrimitive.ChipRemove.Props) {
  return (
    <ComboboxPrimitive.ChipRemove
      data-slot="combobox-chip-remove"
      className={cn(
        "hover:bg-accent-foreground/10 flex items-center justify-center rounded-full p-0.5",
        className,
      )}
      {...props}
    >
      <X className="size-3" />
    </ComboboxPrimitive.ChipRemove>
  );
}

export {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxValue,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipRemove,
};
