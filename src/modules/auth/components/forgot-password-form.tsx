"use client";

import { useState, type FormEvent } from "react";

interface ForgotPasswordFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (email: string) => void;
}

// Componente apenas de renderização: não conhece Service, Adapter ou store.
export function ForgotPasswordForm({ isSubmitting, error, onSubmit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(email);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-foreground text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 rounded-full border px-4 py-2.5 text-sm transition outline-none focus:ring-2"
          placeholder="voce@empresa.com"
        />
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : "Enviar código"}
      </button>
    </form>
  );
}
