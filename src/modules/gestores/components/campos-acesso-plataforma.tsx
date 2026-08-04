"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface AcessoPlataformaValues {
  criarAcesso: boolean;
  password: string;
  mustChangePassword: boolean;
  useTemporaryPassword: boolean;
}

interface CamposAcessoPlataformaProps {
  value: AcessoPlataformaValues;
  onChange: (value: AcessoPlataformaValues) => void;
  // true quando já existe login vinculado (edição) — esconde o bloco
  // inteiro, já que "criar acesso" não se aplica mais.
  jaTemAcesso?: boolean;
}

const inputClassName =
  "rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

// Reaproveitado pelos forms de Gestor e Promotor (2026-08-03) — mesmo bloco
// de "criar acesso na plataforma" (senha + trocar no 1º acesso), extraído
// de create-user-form.tsx pra não duplicar entre os dois módulos novos.
export function CamposAcessoPlataforma({
  value,
  onChange,
  jaTemAcesso = false,
}: CamposAcessoPlataformaProps) {
  const [showPassword, setShowPassword] = useState(false);

  if (jaTemAcesso) {
    return (
      <p className="text-muted-foreground bg-muted/50 rounded-2xl p-3 text-sm">
        Já tem acesso à plataforma — a senha é gerenciada em Usuários.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={value.criarAcesso}
          onChange={(event) => onChange({ ...value, criarAcesso: event.target.checked })}
          className="border-input accent-primary size-4 rounded"
        />
        Criar acesso na plataforma
      </label>

      {value.criarAcesso ? (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-foreground text-sm font-medium">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required={!value.useTemporaryPassword}
                disabled={value.useTemporaryPassword}
                placeholder={value.useTemporaryPassword ? "Gerada automaticamente" : "********"}
                value={value.useTemporaryPassword ? "" : value.password}
                onChange={(event) => onChange({ ...value, password: event.target.value })}
                className={`w-full pr-10 ${inputClassName}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={value.useTemporaryPassword}
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
                checked={value.mustChangePassword}
                onChange={(event) =>
                  onChange({ ...value, mustChangePassword: event.target.checked })
                }
                className="border-input accent-primary size-4 rounded"
              />
              Trocar a senha no primeiro acesso
            </label>

            <label className="text-foreground flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.useTemporaryPassword}
                onChange={(event) =>
                  onChange({ ...value, useTemporaryPassword: event.target.checked })
                }
                className="border-input accent-primary size-4 rounded"
              />
              Criar senha temporária
            </label>
          </div>
        </>
      ) : null}
    </div>
  );
}
