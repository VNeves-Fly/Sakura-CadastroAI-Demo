"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { CriarEventoInput } from "@/modules/eventos/types/evento.types";
import { normalizarSlug } from "@/modules/shared/utils/slug.util";

interface CriarEventoFormProps {
  isSalvando: boolean;
  onCriar: (input: CriarEventoInput) => Promise<void>;
}

const inputClassName =
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border px-4 py-2.5 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

export function CriarEventoForm({ isSalvando, onCriar }: CriarEventoFormProps) {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function handleNomeChange(valor: string) {
    setNome(valor);
    if (!slugEditadoManualmente) setSlug(normalizarSlug(valor));
  }

  function handleSlugChange(valor: string) {
    setSlugEditadoManualmente(true);
    setSlug(valor);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nome.trim()) return;

    setErro(null);
    try {
      await onCriar({ nome: nome.trim(), slug: slug.trim() || null });
      setNome("");
      setSlug("");
      setSlugEditadoManualmente(false);
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-card flex flex-col gap-3 rounded-[1.5rem] border p-6 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="nome-evento" className="text-foreground text-sm font-medium">
            Novo evento
          </label>
          <input
            id="nome-evento"
            type="text"
            required
            placeholder="Ex.: SUMMIT 2026 SP"
            value={nome}
            onChange={(event) => handleNomeChange(event.target.value)}
            disabled={isSalvando}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="slug-evento" className="text-foreground text-sm font-medium">
            Slug (opcional)
          </label>
          <input
            id="slug-evento"
            type="text"
            placeholder="summit-2026-sp"
            value={slug}
            onChange={(event) => handleSlugChange(event.target.value)}
            disabled={isSalvando}
            className={`${inputClassName} font-mono`}
          />
        </div>

        <button
          type="submit"
          disabled={isSalvando || !nome.trim()}
          className="bg-primary text-primary-foreground hover:bg-sakura-600 flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="size-4" />
          Criar evento
        </button>
      </div>

      <p className="text-muted-foreground text-xs">
        O slug é sugerido automaticamente a partir do nome, mas pode ser ajustado — é ele que
        aparece no link público, não o nome do evento.
      </p>

      {erro ? <p className="text-destructive text-xs">{erro}</p> : null}
    </form>
  );
}
