"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

interface CriarEventoFormProps {
  isSalvando: boolean;
  onCriar: (nome: string) => Promise<void>;
}

const inputClassName =
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border px-4 py-2.5 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

export function CriarEventoForm({ isSalvando, onCriar }: CriarEventoFormProps) {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nome.trim()) return;

    setErro(null);
    try {
      await onCriar(nome.trim());
      setNome("");
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-card flex flex-col gap-3 rounded-[1.5rem] border p-6 shadow-sm sm:flex-row sm:items-end"
    >
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
          onChange={(event) => setNome(event.target.value)}
          disabled={isSalvando}
          className={inputClassName}
        />
        {erro ? <p className="text-destructive text-xs">{erro}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSalvando || !nome.trim()}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="size-4" />
        Criar evento
      </button>
    </form>
  );
}
