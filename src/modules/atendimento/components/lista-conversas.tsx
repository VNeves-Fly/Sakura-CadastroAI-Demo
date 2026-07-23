"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Conversa } from "@/modules/atendimento/types/atendimento.types";
import {
  formatarPreviewData,
  iniciaisNome,
} from "@/modules/atendimento/utils/atendimento-formato.util";

interface ListaConversasProps {
  conversas: Conversa[];
  conversaSelecionadaId: string | null;
  onSelecionar: (id: string) => void;
}

function contarNaoLidas(conversa: Conversa): number {
  return conversa.mensagens.filter((mensagem) => mensagem.autor === "cliente" && !mensagem.lido)
    .length;
}

function ultimaMensagem(conversa: Conversa) {
  return conversa.mensagens[conversa.mensagens.length - 1] ?? null;
}

function previewConteudo(conversa: Conversa): string {
  const ultima = ultimaMensagem(conversa);
  if (!ultima) return "Sem mensagens ainda.";
  switch (ultima.tipo) {
    case "audio":
      return "🎤 Áudio";
    case "imagem":
      return "📷 Imagem";
    case "pdf":
      return `📄 ${ultima.conteudo}`;
    default:
      return ultima.conteudo;
  }
}

// Coluna 1 — só busca + lista de conversas (sem abas Inbox/Explore, sem
// "Create New Group", sem seção de Grupos — removidos a pedido, esta
// tela não tem conceito de grupo). Conversa com mensagem nova aparece em
// verde/negrito com o contador de não lidas, igual ao modelo de
// referência.
export function ListaConversas({
  conversas,
  conversaSelecionadaId,
  onSelecionar,
}: ListaConversasProps) {
  const [busca, setBusca] = useState("");

  const conversasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtradas = termo
      ? conversas.filter(
          (conversa) =>
            conversa.membro.nome.toLowerCase().includes(termo) ||
            conversa.agenciaNome.toLowerCase().includes(termo) ||
            conversa.membro.telefone.includes(termo),
        )
      : conversas;

    return [...filtradas].sort((a, b) => {
      const dataA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dataB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dataB - dataA;
    });
  }, [conversas, busca]);

  return (
    <div className="border-border bg-card flex h-full min-h-0 flex-col border-r">
      <div className="border-border border-b p-3">
        <div className="border-input bg-background flex items-center gap-2 rounded-full border px-3 py-2">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            type="text"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por nome, agência ou telefone"
            className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversasFiltradas.length === 0 ? (
          <p className="text-muted-foreground p-4 text-center text-sm">
            Nenhuma conversa encontrada.
          </p>
        ) : (
          conversasFiltradas.map((conversa) => {
            const naoLidas = contarNaoLidas(conversa);
            const temNova = naoLidas > 0;
            const ativa = conversa.id === conversaSelecionadaId;

            return (
              <button
                key={conversa.id}
                type="button"
                onClick={() => onSelecionar(conversa.id)}
                className={`border-border flex w-full items-start gap-3 border-b px-3 py-3 text-left transition ${
                  ativa ? "bg-accent" : "hover:bg-muted/40"
                }`}
              >
                <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {iniciaisNome(conversa.membro.nome)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`truncate text-sm ${
                        temNova ? "text-success font-bold" : "text-foreground font-medium"
                      }`}
                    >
                      {conversa.membro.nome}
                    </span>
                    {conversa.lastMessageAt ? (
                      <span className="text-muted-foreground shrink-0 text-[11px]">
                        {formatarPreviewData(conversa.lastMessageAt)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">{conversa.agenciaNome}</p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-xs ${
                        temNova ? "text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {previewConteudo(conversa)}
                    </p>
                    {temNova ? (
                      <span className="bg-success text-success-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                        {naoLidas}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
