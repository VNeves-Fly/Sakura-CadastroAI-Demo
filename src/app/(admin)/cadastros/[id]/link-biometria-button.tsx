"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, ScanFace, Loader2 } from "lucide-react";
import type { StatusBiometriaVerificacao } from "@/modules/cadastro/domain/enums";

interface LinkBiometriaButtonProps {
  agenciaId: string;
  email: string;
  biometriaStatus: StatusBiometriaVerificacao | null;
  reenviarLinkBiometriaAction: (
    agenciaId: string,
    email: string,
  ) => Promise<{ ok: true; link: string } | { ok: false; motivo: string }>;
}

const LABEL_STATUS: Record<StatusBiometriaVerificacao, string> = {
  pendente: "Biometria: pendente",
  aprovado: "Biometria: aprovada",
  reprovado: "Biometria: reprovada",
  analise_manual: "Biometria: em análise manual",
};

const CLASSES_STATUS: Record<StatusBiometriaVerificacao, string> = {
  pendente: "bg-muted text-muted-foreground",
  aprovado: "bg-success/15 text-success",
  reprovado: "bg-destructive/15 text-destructive",
  analise_manual: "bg-muted text-muted-foreground",
};

function BadgeBiometria({ status }: { status: StatusBiometriaVerificacao | null }) {
  if (!status) {
    return (
      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
        Biometria: não iniciada
      </span>
    );
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${CLASSES_STATUS[status]}`}
    >
      {LABEL_STATUS[status]}
    </span>
  );
}

// Botão de reenvio da verificação de biometria (Legitimuz) — mesmo molde
// de LinkAssinaturaButton (busca sob demanda, copia pra área de
// transferência), mas MUTA de verdade (gera token/sessão novos e tenta
// mandar e-mail — ver ReenviarLinkBiometriaUseCase) em vez de só ler.
// Cobre os dois pedidos do usuário 2026-08-25: "reenviar o e-mail" e "ver
// o link" (a chamada faz as duas coisas, o link fica na tela pra
// conferência/reenvio manual independente do e-mail ter ido ou não).
export function LinkBiometriaButton({
  agenciaId,
  email,
  biometriaStatus,
  reenviarLinkBiometriaAction,
}: LinkBiometriaButtonProps) {
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
    const resultado = await reenviarLinkBiometriaAction(agenciaId, email);
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
      <div className="flex flex-wrap items-center gap-1.5">
        <BadgeBiometria status={biometriaStatus} />
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
            <ScanFace className="size-3" />
          )}
          {carregando
            ? "Gerando link..."
            : copiado
              ? "Copiado!"
              : link
                ? "Copiar link de novo"
                : "Reenviar link de biometria"}
        </button>
      </div>

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
