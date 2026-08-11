"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Loader2 } from "lucide-react";

interface LinkAssinaturaButtonProps {
  agenciaId: string;
  email: string;
  obterLinkAssinaturaAction: (
    agenciaId: string,
    email: string,
  ) => Promise<{ ok: true; link: string } | { ok: false; motivo: string }>;
}

// Busca o link direto de assinatura desse destinatário no D4Sign (ver
// ObterLinkAssinaturaUseCase) sob demanda — não é pré-carregado na Fila de
// Assinatura pra não bater no D4Sign uma vez por signatário a cada
// carregamento da página. Ao buscar com sucesso, já copia pra área de
// transferência (o pedido era "ver/copiar") e mantém o link visível pra
// conferência/reenvio manual.
export function LinkAssinaturaButton({
  agenciaId,
  email,
  obterLinkAssinaturaAction,
}: LinkAssinaturaButtonProps) {
  const [carregando, setCarregando] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function copiar(texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function handleClick() {
    if (link) {
      await copiar(link);
      return;
    }

    setCarregando(true);
    setErro(null);
    const resultado = await obterLinkAssinaturaAction(agenciaId, email);
    setCarregando(false);

    if (!resultado.ok) {
      setErro(resultado.motivo);
      return;
    }

    setLink(resultado.link);
    await copiar(resultado.link);
  }

  return (
    <div className="mt-1.5 flex w-full flex-col gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={carregando}
        className="border-input text-foreground hover:bg-accent flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {carregando ? (
          <Loader2 className="size-3 animate-spin" />
        ) : copiado ? (
          <Check className="size-3" />
        ) : link ? (
          <Copy className="size-3" />
        ) : (
          <Link2 className="size-3" />
        )}
        {carregando
          ? "Buscando link..."
          : copiado
            ? "Copiado!"
            : link
              ? "Copiar link de novo"
              : "Ver/copiar link de assinatura"}
      </button>

      {erro ? <p className="text-destructive text-[11px] font-medium">{erro}</p> : null}

      {link ? (
        <div className="border-border bg-background flex items-center gap-1.5 rounded-lg border px-2 py-1">
          <p className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-[11px]">
            {link}
          </p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir link"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      ) : null}
    </div>
  );
}
