import type { Metadata } from "next";
import Image from "next/image";
import { AcessoExecutivoForm } from "./acesso-executivo-form";

export const metadata: Metadata = {
  title: "Acesso do Executivo — Sakura",
  description:
    "Recupere o seu link personalizado de cadastro na Sakura Consolidadora informando o e-mail cadastrado.",
};

// Tokens de dark mode nunca são ativados no resto do app (não há
// ThemeProvider alternando a classe `.dark` — ver globals.css), então
// escopamos aqui via classe local, mesmo truque de `.chat-scope`: fundo
// escuro fixo pra esta página, independente do restante do produto.
export default function ExecutivoPage() {
  return (
    <main className="dark bg-background relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div className="bg-aurora pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="bg-grid-fade pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="via-primary scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
        aria-hidden="true"
      />

      <section className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <span className="relative block">
          <span
            className="bg-primary/35 pointer-events-none absolute -inset-10 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <Image
            src="/logos/logo-sakura-oficial.png"
            alt="Sakura Consolidadora"
            width={200}
            height={59}
            className="relative h-16 w-auto object-contain sm:h-20"
            priority
          />
        </span>

        <p className="text-muted-foreground mt-14 text-xs tracking-[0.45em] uppercase">
          Inteligência artificial
        </p>
        <h1 className="mt-4 text-4xl leading-tight font-semibold sm:text-5xl">
          <span className="text-gradient-brand text-white">O futuro entra</span>
          <br />
          por convite
        </h1>

        <AcessoExecutivoForm />
      </section>

      <footer className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <span className="bg-border/60 h-px w-16" aria-hidden="true" />
        <p className="text-muted-foreground text-xs sm:text-sm">
          Sistema de cadastro de IA feito pela empresa de desenvolvimento{" "}
          <span className="text-foreground font-semibold">Larian</span>
        </p>
      </footer>
    </main>
  );
}
