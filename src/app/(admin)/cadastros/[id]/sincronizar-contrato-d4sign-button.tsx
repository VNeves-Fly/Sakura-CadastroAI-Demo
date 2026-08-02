"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { sincronizarContratoD4SignAction } from "./actions";

interface SincronizarContratoD4SignButtonProps {
  agenciaId: string;
}

// Botão manual pra reconsultar o D4Sign (lista de destinatários + status
// best-effort, ver SincronizarContratoD4SignUseCase) — edições feitas
// direto no painel do D4Sign (trocar/remover um signatário) não disparam
// nosso webhook, então sem isso não há como perceber que a lista mudou por
// fora da plataforma. Também backfilla assinaturas que um webhook perdido
// não registrou, podendo destravar o avanço de status sozinho.
export function SincronizarContratoD4SignButton({
  agenciaId,
}: SincronizarContratoD4SignButtonProps) {
  const [sincronizando, setSincronizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);

  async function handleClick() {
    setSincronizando(true);
    setErro(null);
    setAvisos([]);

    const resultado = await sincronizarContratoD4SignAction(agenciaId);
    setSincronizando(false);

    if (!resultado.ok) {
      setErro(resultado.motivo);
      return;
    }

    const mensagens: string[] = [];
    if (resultado.adicionados.length > 0) {
      mensagens.push(
        `Apareceram no D4Sign (não estavam na nossa lista): ${resultado.adicionados.join(", ")}.`,
      );
    }
    if (resultado.removidos.length > 0) {
      mensagens.push(`Sumiram da lista do D4Sign: ${resultado.removidos.join(", ")}.`);
    }
    if (resultado.assinaturasAtualizadas > 0) {
      mensagens.push(
        `${resultado.assinaturasAtualizadas} assinatura(s) atualizada(s) a partir do D4Sign.`,
      );
    }
    if (resultado.avancouStatus) {
      mensagens.push("Todos os sócios já haviam assinado — o cadastro avançou de status.");
    }
    if (mensagens.length === 0) {
      mensagens.push(
        `Sem novidades — status do documento no D4Sign: ${resultado.statusDocumento ?? "desconhecido"}.`,
      );
    }
    setAvisos(mensagens);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={sincronizando}
        className="border-input text-foreground hover:bg-accent flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`size-3.5 ${sincronizando ? "animate-spin" : ""}`} />
        {sincronizando ? "Atualizando..." : "Atualizar informações"}
      </button>

      {erro ? <p className="text-destructive text-xs font-medium">{erro}</p> : null}

      {avisos.length > 0 ? (
        <div className="bg-warning/10 text-warning flex flex-col gap-1 rounded-lg px-3 py-2 text-xs">
          {avisos.map((aviso) => (
            <p key={aviso}>{aviso}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
