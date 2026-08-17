"use client";

import { Switch } from "@/components/ui/switch";
import { ToggleVisibilidadeButton } from "@/modules/shared/components/toggle-visibilidade-button";
import { BotaoNovoCadastro } from "@/modules/shared/components/botao-novo-cadastro";
import { BuscaListaInput } from "@/modules/shared/components/busca-lista-input";
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
      <BuscaListaInput
        value={filtros.busca}
        onChange={(valor) => onAtualizarFiltro("busca", valor)}
        placeholder="Buscar executivo..."
      />

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

        <BotaoNovoCadastro href="/crm/executivos/novo" />
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
