"use client";

import type { BaseView } from "@/modules/bases/types/base.types";

interface BaseMultiSelectProps {
  label: string;
  // Opções mostradas — quem chama já decide o recorte (ex.: form de
  // Executivo só passa as bases do Gestor selecionado).
  opcoes: BaseView[];
  selecionadas: string[];
  onChange: (baseIds: string[]) => void;
  vazioLabel?: string;
}

// Reaproveitado pelos forms de Gestor e Executivo (2026-08-04) — mesmo
// padrão de extração de CamposAcessoPlataforma: bloco comum, sem duplicar
// entre os dois módulos.
export function BaseMultiSelect({
  label,
  opcoes,
  selecionadas,
  onChange,
  vazioLabel,
}: BaseMultiSelectProps) {
  function alternar(baseId: string, marcado: boolean) {
    onChange(marcado ? [...selecionadas, baseId] : selecionadas.filter((id) => id !== baseId));
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-foreground text-sm font-medium">{label}</span>
      {opcoes.length === 0 ? (
        <p className="text-muted-foreground text-xs">{vazioLabel ?? "Nenhuma base disponível."}</p>
      ) : (
        <div className="border-input flex max-h-48 flex-col gap-1 overflow-y-auto rounded-2xl border p-3">
          {opcoes.map((base) => (
            <label key={base.id} className="text-foreground flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selecionadas.includes(base.id)}
                onChange={(event) => alternar(base.id, event.target.checked)}
                className="border-input accent-primary size-4 rounded"
              />
              {base.sigla} — {base.nomeCidade}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
