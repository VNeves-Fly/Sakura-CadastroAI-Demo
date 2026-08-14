"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleVisibilidadeButton } from "@/modules/shared/components/toggle-visibilidade-button";
import type { PromotorListaFiltros } from "@/modules/atribuicoes/types/promotor-lista.types";

interface ExecutivosListaToolbarProps {
  filtros: PromotorListaFiltros;
  onAtualizarFiltro: <K extends keyof PromotorListaFiltros>(
    chave: K,
    valor: PromotorListaFiltros[K],
  ) => void;
  total: number;
}

export function ExecutivosListaToolbar({
  filtros,
  onAtualizarFiltro,
  total,
}: ExecutivosListaToolbarProps) {
  return (
    <div className="border-border flex flex-wrap items-center gap-4 border-b pb-4">
      <div className="relative w-full max-w-[230px]">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={filtros.busca}
          onChange={(event) => onAtualizarFiltro("busca", event.target.value)}
          placeholder="Buscar executivo..."
          className="rounded-full pl-8"
        />
      </div>

      <ToggleFiltro
        label="Esconder INATIVO"
        checked={filtros.esconderInativo}
        onCheckedChange={(valor) => onAtualizarFiltro("esconderInativo", valor)}
      />
      <ToggleFiltro
        label="Ocultar sem vendas"
        checked={filtros.ocultarSemVendas}
        onCheckedChange={(valor) => onAtualizarFiltro("ocultarSemVendas", valor)}
      />
      <ToggleFiltro
        label="GCP"
        checked={filtros.gcp}
        onCheckedChange={(valor) => onAtualizarFiltro("gcp", valor)}
      />

      <div className="ml-auto flex items-center gap-3">
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          <span className="text-foreground font-semibold">{total}</span> promotor(es)
        </span>

        <ToggleVisibilidadeButton />

        <Link
          href="/executivos/novo"
          className="bg-primary text-primary-foreground hover:bg-sakura-600 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition"
        >
          <Plus className="size-4" />
          Novo cadastro
        </Link>
      </div>
    </div>
  );
}

function ToggleFiltro({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (valor: boolean) => void;
}) {
  return (
    <label className="text-muted-foreground flex items-center gap-2 text-sm whitespace-nowrap">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      {label}
    </label>
  );
}
