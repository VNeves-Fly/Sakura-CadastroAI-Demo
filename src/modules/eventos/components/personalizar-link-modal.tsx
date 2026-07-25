"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Executivo, AssociacaoOpcao } from "@/modules/eventos/types/evento.types";
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
} from "@/components/ui/combobox";

interface PersonalizarLinkModalProps {
  eventoNome: string;
  executivos: Executivo[];
  associacoes: AssociacaoOpcao[];
  isSalvando: boolean;
  onFechar: () => void;
  onConfirmar: (data: { promotorId: string | null; associacaoId: string | null }) => Promise<void>;
}

// Modal de personalização do link de um Evento: escolhe um Executivo
// e/ou uma Associação (pelo menos um dos dois) — a combinação vira um
// EventoLink novo, cujo link gerado carrega esses ids por querystring
// pro formulário público de cadastro.
export function PersonalizarLinkModal({
  eventoNome,
  executivos,
  associacoes,
  isSalvando,
  onFechar,
  onConfirmar,
}: PersonalizarLinkModalProps) {
  const [executivoSelecionado, setExecutivoSelecionado] = useState<Executivo | null>(null);
  const [associacaoSelecionada, setAssociacaoSelecionada] = useState<AssociacaoOpcao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    if (!executivoSelecionado && !associacaoSelecionada) {
      setErro("Selecione ao menos um executivo ou uma associação.");
      return;
    }
    setErro(null);
    try {
      await onConfirmar({
        promotorId: executivoSelecionado?.id ?? null,
        associacaoId: associacaoSelecionada?.id ?? null,
      });
      onFechar();
    } catch (caughtError) {
      setErro(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md">
      <div className="border-border bg-card flex w-full max-w-md flex-col gap-4 rounded-3xl border p-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-base font-semibold">
            Personalizar link — {eventoNome}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            disabled={isSalvando}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full p-1 transition disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <p className="text-muted-foreground text-sm">
          Escolha um executivo e/ou uma associação — quem abrir esse link já chega com o campo
          correspondente preenchido e travado no cadastro.
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-medium">Executivo</label>
          <Combobox<Executivo>
            items={executivos}
            value={executivoSelecionado}
            onValueChange={setExecutivoSelecionado}
            itemToStringLabel={(executivo) => executivo.nome}
          >
            <ComboboxInputGroup>
              <ComboboxInput placeholder="Busque por nome (opcional)" autoComplete="off" />
            </ComboboxInputGroup>
            <ComboboxContent>
              {(executivo: Executivo) => (
                <ComboboxItem key={executivo.id} value={executivo}>
                  {executivo.nome}
                </ComboboxItem>
              )}
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-foreground text-sm font-medium">Associação</label>
          <Combobox<AssociacaoOpcao>
            items={associacoes}
            value={associacaoSelecionada}
            onValueChange={setAssociacaoSelecionada}
            itemToStringLabel={(associacao) => associacao.nome}
          >
            <ComboboxInputGroup>
              <ComboboxInput placeholder="Busque por nome (opcional)" autoComplete="off" />
            </ComboboxInputGroup>
            <ComboboxContent>
              {(associacao: AssociacaoOpcao) => (
                <ComboboxItem key={associacao.id} value={associacao}>
                  {associacao.nome}
                </ComboboxItem>
              )}
            </ComboboxContent>
          </Combobox>
        </div>

        {erro ? <p className="text-destructive text-xs">{erro}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onFechar}
            disabled={isSalvando}
            className="border-input text-foreground hover:bg-accent rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={isSalvando}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            Gerar link
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
