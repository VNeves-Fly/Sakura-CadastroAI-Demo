"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Evento, Executivo } from "@/modules/eventos/types/evento.types";
import { EventoLinkRow } from "@/modules/eventos/components/evento-link-row";
import { formatarTempoDecorrido } from "@/modules/eventos/utils/evento-formato.util";

interface EventoCardProps {
  evento: Evento;
  executivos: Executivo[];
  isSalvando: boolean;
  onCriarLink: (executivoId: string) => Promise<void>;
  onAlternarAtivoLink: (linkId: string) => Promise<void>;
}

export function EventoCard({
  evento,
  executivos,
  isSalvando,
  onCriarLink,
  onAlternarAtivoLink,
}: EventoCardProps) {
  const executivosDisponiveis = executivos.filter(
    (executivo) => !evento.links.some((link) => link.executivoId === executivo.id),
  );
  // Estado guarda só a *escolha manual* do usuário — se ela não existir
  // mais entre os disponíveis (ex.: acabou de criar um link e aquele
  // executivo saiu da lista), cai pro primeiro disponível na hora de
  // renderizar, sem precisar de useEffect pra "corrigir" o estado depois.
  const [escolhaManual, setEscolhaManual] = useState<string | null>(null);
  const executivoSelecionado = executivosDisponiveis.some(
    (executivo) => executivo.id === escolhaManual,
  )
    ? escolhaManual!
    : (executivosDisponiveis[0]?.id ?? "");
  const [erro, setErro] = useState<string | null>(null);

  const executivoItems: Record<string, string> = Object.fromEntries(
    executivosDisponiveis.map((executivo) => [executivo.id, executivo.nome]),
  );

  async function adicionarLink() {
    if (!executivoSelecionado) return;
    setErro(null);
    try {
      await onCriarLink(executivoSelecionado);
      setEscolhaManual(null);
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-[1.5rem] border p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-foreground text-base font-semibold">{evento.nome}</h2>
        <span className="text-muted-foreground text-xs">
          criado {formatarTempoDecorrido(evento.createdAt)}
        </span>
      </div>

      {evento.links.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum link de executivo criado ainda pra este evento.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {evento.links.map((link) => (
            <EventoLinkRow key={link.id} link={link} onAlternarAtivo={onAlternarAtivoLink} />
          ))}
        </div>
      )}

      {executivosDisponiveis.length > 0 ? (
        <div className="border-border flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Select
              items={executivoItems}
              value={executivoSelecionado}
              onValueChange={(valor) => setEscolhaManual(valor ?? null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha o executivo dono do link" />
              </SelectTrigger>
              <SelectContent>
                {executivosDisponiveis.map((executivo) => (
                  <SelectItem key={executivo.id} value={executivo.id}>
                    {executivo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={adicionarLink}
            disabled={isSalvando || !executivoSelecionado}
            className="border-input text-foreground hover:bg-accent flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus className="size-4" />
            Criar link
          </button>
        </div>
      ) : null}

      {erro ? <p className="text-destructive text-xs">{erro}</p> : null}
    </div>
  );
}
