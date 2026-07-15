"use client";

import { useState, type FormEvent } from "react";
import type { CreateUserFormValues } from "@/modules/users/types/user.types";

interface CreateUserFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: CreateUserFormValues) => Promise<boolean>;
}

export function CreateUserForm({ isSubmitting, error, onSubmit }: CreateUserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = await onSubmit({ name, email, password });

    if (succeeded) {
      setName("");
      setEmail("");
      setPassword("");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-md border border-slate-200 p-4"
    >
      <h2 className="text-sm font-semibold text-slate-900">Novo usuário</h2>

      <input
        type="text"
        required
        placeholder="Nome"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
      />

      <input
        type="email"
        required
        placeholder="E-mail"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
      />

      <input
        type="password"
        required
        placeholder="Senha"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Salvando..." : "Cadastrar"}
      </button>
    </form>
  );
}
