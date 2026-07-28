"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { solicitarLinkExecutivoAction } from "./actions";

type Status =
  | { kind: "idle" }
  | { kind: "success"; email: string }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

const MENSAGEM_PADRAO =
  "Você receberá seu link personalizado para cadastros e atualizações de agência para sua carteira.";

export function AcessoExecutivoForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailEnviado = email.trim();

    startTransition(async () => {
      try {
        const resultado = await solicitarLinkExecutivoAction(emailEnviado);
        setStatus(
          resultado.encontrado ? { kind: "success", email: emailEnviado } : { kind: "not-found" },
        );
      } catch (error) {
        setStatus({
          kind: "error",
          message:
            error instanceof Error ? error.message : "Não foi possível enviar. Tente novamente.",
        });
      }
    });
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <form onSubmit={handleSubmit} className="w-full">
        <label htmlFor="email-executivo" className="sr-only">
          E-mail
        </label>
        <div className="relative w-full">
          <input
            id="email-executivo"
            type="email"
            required
            autoComplete="email"
            value={email}
            disabled={isPending}
            onChange={(event) => {
              setEmail(event.target.value);
              setStatus({ kind: "idle" });
            }}
            placeholder="seu@email.com"
            className="border-border/60 bg-card/60 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-ring/40 w-full rounded-full border py-4 pr-16 pl-6 text-base shadow-[0_0_40px_-14px_hsl(var(--pink-glow)/0.5)] backdrop-blur-sm transition-colors outline-none focus-visible:ring-2 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isPending}
            aria-label="Enviar"
            className="bg-primary text-primary-foreground hover:bg-primary/90 absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full transition disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>

      <p
        role="status"
        aria-live="polite"
        className={
          status.kind === "success"
            ? "text-success text-center text-sm"
            : status.kind === "not-found"
              ? "text-warning text-center text-sm"
              : status.kind === "error"
                ? "text-destructive text-center text-sm"
                : "text-muted-foreground text-center text-sm"
        }
      >
        {status.kind === "success" &&
          `Enviamos seu link personalizado para ${status.email}. Confira sua caixa de entrada (e o spam).`}
        {status.kind === "not-found" &&
          "Não encontramos esse e-mail em nossa base de promotores. Fale com o seu gestor para regularizar o cadastro."}
        {status.kind === "error" && status.message}
        {status.kind === "idle" && MENSAGEM_PADRAO}
      </p>
    </div>
  );
}
