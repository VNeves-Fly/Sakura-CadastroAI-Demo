"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

interface ResetPasswordFormProps {
  verified: boolean;
  isSubmitting: boolean;
  error: string | null;
  onVerifyCode: (codigo: string) => void;
  onSubmitPassword: (newPassword: string, confirmPassword: string) => void;
}

// Componente de duas etapas controlado pelo boolean `verified`: primeiro o
// código de 6 dígitos, depois (só quando o backend confirma) os campos de
// nova senha — mesma origem de estado que o token+OTP no backend.
export function ResetPasswordForm({
  verified,
  isSubmitting,
  error,
  onVerifyCode,
  onSubmitPassword,
}: ResetPasswordFormProps) {
  const [codigo, setCodigo] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!verified) {
    function handleVerify(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      onVerifyCode(codigo);
    }

    return (
      <form onSubmit={handleVerify} className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="codigo" className="text-foreground text-sm font-medium">
            Código de verificação
          </label>
          <input
            id="codigo"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            value={codigo}
            onChange={(event) => setCodigo(event.target.value.replace(/\D/g, ""))}
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 rounded-full border px-4 py-2.5 text-center text-lg tracking-[0.5em] transition outline-none focus:ring-2"
            placeholder="000000"
          />
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || codigo.length !== 6}
          className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Verificando..." : "Verificar código"}
        </button>
      </form>
    );
  }

  function handleSubmitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmitPassword(newPassword, confirmPassword);
  }

  return (
    <form onSubmit={handleSubmitPassword} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-foreground text-sm font-medium">
          Nova senha
        </label>
        <div className="relative">
          <input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border px-4 py-2.5 pr-10 text-sm transition outline-none focus:ring-2"
            placeholder="********"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center transition"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-foreground text-sm font-medium">
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 rounded-full border px-4 py-2.5 text-sm transition outline-none focus:ring-2"
          placeholder="********"
        />
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Salvando..." : "Trocar senha"}
      </button>
    </form>
  );
}
