"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import Image from "next/image";
import { useChatScript } from "./use-chat-script";
import { ChatBubble } from "./chat-bubble";
import { QuickReplies } from "./quick-replies";
import { InlineFormCard } from "./inline-form-card";
import { MessageBox } from "./message-box";

export function ChatWizard() {
  const { messages, pending, onEnviarTexto, onQuickReply, onEnviarForm, onEnviarArquivo } =
    useChatScript();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  function aoSelecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (arquivo) onEnviarArquivo(arquivo.name);
    event.target.value = "";
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[20px] bg-black/50 shadow-2xl shadow-black/40 backdrop-blur-sm">
      <header className="relative flex items-center gap-3 bg-black/20 py-3 pr-4 pl-[62px]">
        <div className="absolute top-2 left-2 size-9 overflow-hidden rounded-full border-2 border-white/20 bg-white">
          <Image
            src="/logos/logo-sakura-oficial.png"
            alt="Sakura"
            fill
            className="object-contain p-1"
          />
        </div>
        <div className="flex flex-col uppercase">
          <h1 className="text-[11px] font-semibold text-white">Sakura Consolidadora</h1>
          <h2 className="text-[9px] tracking-wide text-white/50">Assistente de cadastro</h2>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4">
        {messages.map((mensagem) => (
          <ChatBubble key={mensagem.id} mensagem={mensagem} />
        ))}

        {pending?.kind === "quick-replies" ? (
          <QuickReplies opcoes={pending.opcoes} onEscolher={onQuickReply} />
        ) : null}

        {pending?.kind === "inline-form" ? (
          <InlineFormCard
            titulo={pending.titulo}
            campos={pending.campos}
            onConfirmar={onEnviarForm}
          />
        ) : null}

        {pending?.kind === "arquivo" ? (
          <div className="mb-4 ml-9 max-w-[220px]">
            <label className="border-sakura-300/40 hover:bg-sakura-500/10 flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed bg-white/5 px-4 py-4 text-center text-[10px] text-white/70 transition">
              <span className="font-semibold text-white">Anexar arquivo</span>
              <span>{pending.instrucao}</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={aoSelecionarArquivo}
              />
            </label>
          </div>
        ) : null}
      </div>

      <MessageBox pending={pending} onEnviar={onEnviarTexto} />
    </div>
  );
}
