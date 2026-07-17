import type { Metadata } from "next";
import { ChatWizard } from "./chat-wizard";

export const metadata: Metadata = {
  title: "Cadastro via Chat — Sakura",
};

// Protótipo visual: mesmo roteiro de campos do wizard em /cadastro/[slug],
// só que no estilo de conversa (inspirado em codepen.io/supah/pen/jqOBqp).
// Sem slug/convite — CNPJ é a primeira pergunta. Ver use-chat-script.ts.
export default function ChatPage() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a0a14] via-[#2b0f1f] to-black p-4">
      <div className="bg-pink-glow/30 absolute top-[-10%] left-[-10%] size-[420px] rounded-full blur-[120px]" />
      <div className="bg-violet-glow/25 absolute right-[-10%] bottom-[-10%] size-[420px] rounded-full blur-[120px]" />
      <div className="relative z-10 h-[85vh] max-h-[640px] w-full max-w-[380px]">
        <ChatWizard />
      </div>
    </div>
  );
}
