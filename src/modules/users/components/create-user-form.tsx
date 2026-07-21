"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { CARGO_OPTIONS, DEFAULT_CARGO } from "@/modules/users/utils/cargo-options";
import type { Cargo } from "@/modules/users/domain/enums";
import type { CreateUserFormValues } from "@/modules/users/types/user.types";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface CreateUserFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: CreateUserFormValues) => Promise<boolean>;
}

const inputClassName =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

export function CreateUserForm({ isSubmitting, error, onSubmit }: CreateUserFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cargo, setCargo] = useState<Cargo>(DEFAULT_CARGO);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [useTemporaryPassword, setUseTemporaryPassword] = useState(false);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setCargo(DEFAULT_CARGO);
    setPassword("");
    setMustChangePassword(false);
    setUseTemporaryPassword(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = await onSubmit({
      firstName,
      lastName,
      email,
      phone,
      cargo,
      password,
      mustChangePassword,
      useTemporaryPassword,
    });

    if (succeeded) {
      resetForm();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-card flex flex-col gap-4 rounded-[1.5rem] border p-6 shadow-sm"
    >
      <h2 className="text-foreground text-sm font-semibold">Novo usuário</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="firstName" className="text-foreground text-sm font-medium">
            Nome
          </label>
          <input
            id="firstName"
            type="text"
            required
            placeholder="Nome"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="lastName" className="text-foreground text-sm font-medium">
            Sobrenome
          </label>
          <input
            id="lastName"
            type="text"
            required
            placeholder="Sobrenome"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-foreground text-sm font-medium">
          Telefone (WhatsApp)
        </label>
        <input
          id="phone"
          type="tel"
          required
          placeholder="(11) 91234-5678"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-foreground text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder="voce@empresa.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cargo" className="text-foreground text-sm font-medium">
          Cargo
        </label>
        <Select
          value={cargo}
          onValueChange={(valor) => setCargo((valor ?? DEFAULT_CARGO) as Cargo)}
        >
          <SelectTrigger id="cargo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CARGO_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-foreground text-sm font-medium">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required={!useTemporaryPassword}
            disabled={useTemporaryPassword}
            placeholder={useTemporaryPassword ? "Gerada automaticamente" : "********"}
            value={useTemporaryPassword ? "" : password}
            onChange={(event) => setPassword(event.target.value)}
            className={`w-full pr-10 ${inputClassName}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            disabled={useTemporaryPassword}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="bg-muted/50 flex flex-col gap-2 rounded-2xl p-3">
        <label className="text-foreground flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mustChangePassword}
            onChange={(event) => setMustChangePassword(event.target.checked)}
            className="border-input accent-primary size-4 rounded"
          />
          Trocar a senha no primeiro acesso
        </label>

        <label className="text-foreground flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useTemporaryPassword}
            onChange={(event) => setUseTemporaryPassword(event.target.checked)}
            className="border-input accent-primary size-4 rounded"
          />
          Criar senha temporária
        </label>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Salvando..." : "Cadastrar"}
      </button>
    </form>
  );
}
