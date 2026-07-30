"use client";

import { useState, useTransition, type FormEvent } from "react";
import { solicitarLinkExecutivoAction } from "./actions";

type Status =
  | { kind: "idle" }
  | { kind: "success"; email: string }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

const MENSAGEM_PADRAO =
  "Você receberá seu link personalizado para cadastros e atualizações de agência para sua carteira";

export function AcessoExecutivoForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();
  const bloqueado = isPending || status.kind === "success";

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
    <form onSubmit={handleSubmit} className="mt-10 w-full">
      <div className="border-border bg-card/65 rounded-2xl border p-1.5 shadow-[0_0_60px_-10px_hsl(var(--primary)/0.55)] backdrop-blur-xl">
        <label htmlFor="email-executivo" className="sr-only">
          Seu e-mail
        </label>
        <input
          id="email-executivo"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={255}
          disabled={bloqueado}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status.kind !== "idle" && status.kind !== "success") setStatus({ kind: "idle" });
          }}
          placeholder="seu@email.com"
          className="text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-xl bg-transparent px-5 py-4 text-center text-lg tracking-wide outline-none focus-visible:ring-2 disabled:opacity-60"
        />
      </div>

      <p
        role="status"
        aria-live="polite"
        className={
          status.kind === "success"
            ? "text-gradient-brand mt-4 text-center text-sm font-medium"
            : status.kind === "not-found"
              ? "text-warning mt-4 text-center text-sm"
              : status.kind === "error"
                ? "text-destructive mt-4 text-center text-sm"
                : "text-muted-foreground mt-4 text-center text-sm"
        }
      >
        {status.kind === "success" &&
          `Enviamos seu link personalizado para ${status.email}. Confira sua caixa de entrada (e o spam).`}
        {status.kind === "not-found" &&
          "Não encontramos esse e-mail em nossa base de promotores. Fale com o seu gestor para regularizar o cadastro."}
        {status.kind === "error" && status.message}
        {status.kind === "idle" && (isPending ? "Enviando..." : MENSAGEM_PADRAO)}
      </p>
    </form>
  );
}
