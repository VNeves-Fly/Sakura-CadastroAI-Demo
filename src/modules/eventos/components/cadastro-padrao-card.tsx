"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import type { Executivo, AssociacaoOpcao } from "@/modules/eventos/types/evento.types";
import { GerarLinkModal } from "@/modules/shared/components/gerar-link-modal";

interface CadastroPadraoCardProps {
  executivos: Executivo[];
  associacoes: AssociacaoOpcao[];
}

// Card fixo, sempre o primeiro da página — representa o cadastro básico
// (/cadastro, sem evento). Mesmo GerarLinkModal do EventoCard, só que sem
// eventoSlug: o link fica só `?executivo=&associacao=`.
export function CadastroPadraoCard({ executivos, associacoes }: CadastroPadraoCardProps) {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-[1.5rem] border p-6 shadow-sm">
      <div>
        <h2 className="text-foreground text-base font-semibold">Cadastro Padrão</h2>
        <p className="text-muted-foreground font-mono text-xs">/cadastro</p>
      </div>

      <div className="border-border border-t pt-4">
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="border-input text-foreground hover:bg-accent flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition"
        >
          <Link2 className="size-4" />
          Gerar link
        </button>
      </div>

      {modalAberto ? (
        <GerarLinkModal
          titulo="Personalizar link — Cadastro Padrão"
          executivos={executivos}
          associacoes={associacoes}
          onFechar={() => setModalAberto(false)}
        />
      ) : null}
    </div>
  );
}
