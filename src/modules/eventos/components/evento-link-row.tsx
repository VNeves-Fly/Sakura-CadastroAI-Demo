"use client";

import { useState } from "react";
import { Check, Copy, Users } from "lucide-react";
import type { EventoLink } from "@/modules/eventos/types/evento.types";
import { montarUrlEventoLink } from "@/modules/eventos/utils/link-publico.util";

interface EventoLinkRowProps {
  link: EventoLink;
  onAlternarAtivo: (linkId: string) => Promise<void>;
}

export function EventoLinkRow({ link, onAlternarAtivo }: EventoLinkRowProps) {
  const [copiado, setCopiado] = useState(false);
  const [isAlternando, setIsAlternando] = useState(false);
  const url = montarUrlEventoLink(link.slug);

  async function copiarUrl() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function alternar() {
    setIsAlternando(true);
    try {
      await onAlternarAtivo(link.id);
    } finally {
      setIsAlternando(false);
    }
  }

  return (
    <div className="border-border bg-muted/20 flex flex-col gap-2 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
            {link.executivoNome}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
              link.ativo
                ? "bg-success-bg text-success-text"
                : "bg-destructive-bg text-destructive-text"
            }`}
          >
            {link.ativo ? "Ativo" : "Inativo"}
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Users className="size-3.5" />
            {link.totalAgenciasCadastradas} agência(s) cadastrada(s)
          </span>
        </div>
        <p className="text-foreground mt-1 truncate font-mono text-xs">{url}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={copiarUrl}
          className="border-input text-foreground hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
        >
          {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copiado ? "Copiado" : "Copiar link"}
        </button>
        <button
          type="button"
          onClick={alternar}
          disabled={isAlternando}
          className="border-input text-foreground hover:bg-accent rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {link.ativo ? "Desativar" : "Ativar"}
        </button>
      </div>
    </div>
  );
}
