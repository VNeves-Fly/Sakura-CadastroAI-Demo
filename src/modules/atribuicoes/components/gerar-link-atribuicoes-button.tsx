"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { GerarLinkModal } from "@/modules/shared/components/gerar-link-modal";

interface OpcaoComNome {
  id: string;
  nome: string;
}

interface GerarLinkAtribuicoesButtonProps {
  executivos: OpcaoComNome[];
  associacoes: OpcaoComNome[];
}

// Gera o link personalizado do cadastro básico (sem evento) — mesmo
// GerarLinkModal usado em Eventos, só que sem eventoSlug: o link fica só
// `?executivo=&associacao=`.
export function GerarLinkAtribuicoesButton({
  executivos,
  associacoes,
}: GerarLinkAtribuicoesButtonProps) {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAberto(true)}
        className="border-input text-foreground hover:bg-accent flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition"
      >
        <Link2 className="size-4" />
        Gerar link
      </button>

      {modalAberto ? (
        <GerarLinkModal
          titulo="Gerar link personalizado"
          descricao="Escolha um executivo e/ou uma associação — quem abrir esse link já chega com o campo correspondente preenchido e travado no cadastro básico."
          executivos={executivos}
          associacoes={associacoes}
          onFechar={() => setModalAberto(false)}
        />
      ) : null}
    </>
  );
}
