import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import Image from "next/image";
import { AnimatedGradientBackground } from "@/components/animated-gradient-background";
import { ChatWizard } from "./chat-wizard";

export const metadata: Metadata = {
  title: "Cadastro via Chat — Sakura",
};

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik",
});

// Mesmo roteiro de campos do wizard /cadastro, só que no estilo de
// conversa (inspirado em codepen.io/supah/pen/jqOBqp) — ligado aos
// mesmos service/adapter reais (agenciaService, cepService), sem
// slug/convite: CNPJ é a primeira pergunta. Ver use-chat-script.ts.
// Fonte (Rubik 300–900) e cores seguem o guia de estilo entregue — ver
// ".chat-scope" em globals.css, escopado só a esta rota.
export default function ChatPage() {
  return (
    <div
      className={`${rubik.variable} font-rubik chat-scope relative flex h-dvh w-full flex-col items-center gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4`}
    >
      {/* Substitui o antigo bg-gradient-to-br estático — precisa vir sem
          fundo próprio no container acima, senão ocultaria esta camada
          (fixed + z-index negativo) atrás dela. */}
      <AnimatedGradientBackground />

      <div className="bg-pink-glow/30 absolute top-[-10%] left-[-10%] size-[420px] rounded-full blur-[120px]" />
      <div className="bg-violet-glow/20 absolute right-[-10%] bottom-[-10%] size-[420px] rounded-full blur-[120px]" />

      <Image
        src="/logos/logo-sakura-oficial.png"
        alt="Sakura"
        width={160}
        height={48}
        className="relative z-10 h-8 w-auto shrink-0 object-contain drop-shadow-[0_0_18px_hsl(var(--pink-glow)/0.6)] sm:h-11"
        priority
      />

      {/* Largura/altura fluidas (clamp via min()) em vez de um card fixo
          pequeno — preenche quase a tela toda no mobile e cresce até um
          teto sensato no desktop, sem pular entre dois breakpoints. */}
      <div className="relative z-10 max-h-[760px] min-h-0 w-[min(94vw,520px)] flex-1">
        <ChatWizard />
      </div>
    </div>
  );
}
