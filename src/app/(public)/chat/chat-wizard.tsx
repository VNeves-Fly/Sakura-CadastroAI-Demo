"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useChatScript } from "./use-chat-script";
import { ChatBubble } from "./chat-bubble";
import { QuickReplies } from "./quick-replies";
import { InlineFormCard } from "./inline-form-card";
import { MessageBox } from "./message-box";
import { FileDropZone } from "./file-drop-zone";
import { LoadingPage } from "./loading-page";
import { ResultadoFinal } from "./resultado-final";
import { AnaliseDocumentoLoading } from "@/modules/cadastro/components/analise-documento-loading";

export function ChatWizard() {
  const {
    messages,
    pending,
    fase,
    resultadoFinal,
    analisandoDocumento,
    onEnviarTexto,
    onQuickReply,
    onEnviarForm,
    onEnviarArquivo,
  } = useChatScript();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  if (fase === "analisando") {
    return <LoadingPage />;
  }

  if (fase === "resultado" && resultadoFinal) {
    return <ResultadoFinal resultado={resultadoFinal} />;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-black/35 shadow-2xl shadow-black/50 backdrop-blur-xl">
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

      <div ref={scrollRef} className="scrollbar-hidden flex-1 overflow-y-auto px-4 pt-4">
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
          <FileDropZone instrucao={pending.instrucao} onArquivo={onEnviarArquivo} />
        ) : null}
      </div>

      <MessageBox pending={pending} onEnviar={onEnviarTexto} />

      <AnaliseDocumentoLoading
        visivel={Boolean(analisandoDocumento)}
        mensagem={analisandoDocumento ?? undefined}
      />
    </div>
  );
}
