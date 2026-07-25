"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import type { Evento, Executivo, AssociacaoOpcao } from "@/modules/eventos/types/evento.types";
import { EventoLinkRow } from "@/modules/eventos/components/evento-link-row";
import { PersonalizarLinkModal } from "@/modules/eventos/components/personalizar-link-modal";
import { formatarTempoDecorrido } from "@/modules/eventos/utils/evento-formato.util";

interface EventoCardProps {
  evento: Evento;
  executivos: Executivo[];
  associacoes: AssociacaoOpcao[];
  isSalvando: boolean;
  onCriarLink: (data: { promotorId: string | null; associacaoId: string | null }) => Promise<void>;
  onAlternarAtivoLink: (linkId: string) => Promise<void>;
}

export function EventoCard({
  evento,
  executivos,
  associacoes,
  isSalvando,
  onCriarLink,
  onAlternarAtivoLink,
}: EventoCardProps) {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-[1.5rem] border p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-foreground text-base font-semibold">{evento.nome}</h2>
        <span className="text-muted-foreground text-xs">
          criado {formatarTempoDecorrido(evento.createdAt)}
        </span>
      </div>

      {evento.links.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum link personalizado criado ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {evento.links.map((link) => (
            <EventoLinkRow key={link.id} link={link} onAlternarAtivo={onAlternarAtivoLink} />
          ))}
        </div>
      )}

      <div className="border-border border-t pt-4">
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="border-input text-foreground hover:bg-accent flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition"
        >
          <Link2 className="size-4" />
          Personalizar link
        </button>
      </div>

      {modalAberto ? (
        <PersonalizarLinkModal
          eventoNome={evento.nome}
          executivos={executivos}
          associacoes={associacoes}
          isSalvando={isSalvando}
          onFechar={() => setModalAberto(false)}
          onConfirmar={onCriarLink}
        />
      ) : null}
    </div>
  );
}
