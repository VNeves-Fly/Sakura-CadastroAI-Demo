"use client";

import { UserCog } from "lucide-react";
import type { AssumirAtendimentoRegistro } from "@/modules/atendimento/types/atendimento.types";
import {
  HORAS_LIMITE_ASSUMIR,
  podeAssumirAtendimento,
} from "@/modules/atendimento/services/atendimento-api";
import { formatarTempoDecorrido } from "@/modules/atendimento/utils/atendimento-formato.util";

interface AssumirAtendimentoBannerProps {
  atendimentoAtual: AssumirAtendimentoRegistro | null;
  analistaAtual: string;
  onAssumir: () => void;
}

// A conversa é aberta — todo analista vê tudo — mas só existe 1 "dono"
// por vez (atendimentoAtual). Regra combinada com o usuário: só dá pra
// assumir de outro analista se ele ficar mais de 2h sem interagir (ver
// podeAssumirAtendimento). Ninguém tem permissão de excluir a conversa —
// por isso não existe nenhum botão de excluir em lugar nenhum deste
// módulo.
export function AssumirAtendimentoBanner({
  atendimentoAtual,
  analistaAtual,
  onAssumir,
}: AssumirAtendimentoBannerProps) {
  if (!atendimentoAtual) {
    return (
      <div className="border-border bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">Nenhum analista está atendendo esta conversa.</span>
        <button
          type="button"
          onClick={onAssumir}
          className="bg-primary text-primary-foreground hover:bg-sakura-600 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
        >
          <UserCog className="size-3.5" />
          Assumir atendimento
        </button>
      </div>
    );
  }

  const souEu = atendimentoAtual.analistaNome === analistaAtual;
  const podeAssumir = !souEu && podeAssumirAtendimento(atendimentoAtual);

  return (
    <div className="border-border bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">
        Em atendimento por{" "}
        <strong className="text-foreground">
          {souEu ? "você" : atendimentoAtual.analistaNome}
        </strong>{" "}
        (assumiu {formatarTempoDecorrido(atendimentoAtual.assumidoEm)})
      </span>
      {podeAssumir ? (
        <button
          type="button"
          onClick={onAssumir}
          className="bg-primary text-primary-foreground hover:bg-sakura-600 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
        >
          <UserCog className="size-3.5" />
          Assumir atendimento
        </button>
      ) : !souEu ? (
        <span
          className="text-muted-foreground shrink-0 text-xs"
          title={`Só é possível assumir depois de ${HORAS_LIMITE_ASSUMIR}h sem interação`}
        >
          Aguardando {HORAS_LIMITE_ASSUMIR}h de inatividade pra poder assumir
        </span>
      ) : null}
    </div>
  );
}
