"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import type { Evento, Executivo, AssociacaoOpcao } from "@/modules/eventos/types/evento.types";
import { GerarLinkModal } from "@/modules/shared/components/gerar-link-modal";
import { formatarTempoDecorrido } from "@/modules/eventos/utils/evento-formato.util";

interface EventoCardProps {
  evento: Evento;
  executivos: Executivo[];
  associacoes: AssociacaoOpcao[];
}

export function EventoCard({ evento, executivos, associacoes }: EventoCardProps) {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-[1.5rem] border p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-foreground text-base font-semibold">{evento.nome}</h2>
          {evento.slug ? (
            <p className="text-muted-foreground font-mono text-xs">/{evento.slug}</p>
          ) : null}
        </div>
        <span className="text-muted-foreground text-xs">
          criado {formatarTempoDecorrido(evento.createdAt)}
        </span>
      </div>

      <div className="border-border border-t pt-4">
        {evento.slug ? (
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="border-input text-foreground hover:bg-accent flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition"
          >
            <Link2 className="size-4" />
            Gerar link
          </button>
        ) : (
          <p className="text-muted-foreground text-xs">
            Defina um slug pra esse evento (editar em breve) pra gerar o link público.
          </p>
        )}
      </div>

      {modalAberto ? (
        <GerarLinkModal
          titulo={`Personalizar link — ${evento.nome}`}
          executivos={executivos}
          associacoes={associacoes}
          eventoSlug={evento.slug}
          onFechar={() => setModalAberto(false)}
        />
      ) : null}
    </div>
  );
}
