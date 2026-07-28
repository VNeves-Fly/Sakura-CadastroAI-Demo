import type { Metadata } from "next";
import Image from "next/image";
import { AcessoExecutivoForm } from "./acesso-executivo-form";

export const metadata: Metadata = {
  title: "Acesso do Executivo — Sakura",
};

// Tokens de dark mode nunca são ativados no resto do app (não há
// ThemeProvider alternando a classe `.dark` — ver globals.css), então
// escopamos aqui via classe local, mesmo truque de `.chat-scope`: fundo
// escuro fixo pra esta página, independente do restante do produto.
export default function ExecutivoPage() {
  return (
    <div className="dark bg-background relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(hsl(var(--foreground)/0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.05)_1px,transparent_1px)] [background-size:48px_48px] opacity-40"
        aria-hidden="true"
      />
      <div
        className="bg-violet-glow/25 pointer-events-none absolute top-[-15%] left-[-10%] size-[480px] rounded-full blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="bg-pink-glow/20 pointer-events-none absolute right-[-15%] bottom-[-15%] size-[480px] rounded-full blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        <Image
          src="/logos/logo-sakura-oficial.png"
          alt="Sakura Consolidadora"
          width={200}
          height={59}
          className="h-14 w-auto object-contain drop-shadow-[0_0_24px_hsl(var(--pink-glow)/0.45)]"
          priority
        />

        <div className="flex flex-col items-center gap-3">
          <span className="text-muted-foreground text-xs font-medium tracking-[0.25em] uppercase">
            Inteligência Artificial
          </span>
          <h1 className="text-3xl font-bold sm:text-4xl">
            <span className="text-gradient-brand block">O futuro entra</span>
            <span className="text-foreground block">por convite</span>
          </h1>
        </div>

        <AcessoExecutivoForm />
      </div>

      <footer className="relative z-10 mt-16 flex flex-col items-center gap-3 text-center">
        <div className="border-border/60 h-px w-24 border-t" />
        <p className="text-muted-foreground text-xs">
          Sistema de cadastro de IA feito pela empresa de desenvolvimento{" "}
          <span className="text-foreground font-semibold">Larian</span>
        </p>
      </footer>
    </div>
  );
}
