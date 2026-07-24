"use client";

import Image from "next/image";
import { useResetPasswordViewModel } from "@/modules/auth/view-models/use-reset-password.view-model";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";

interface ResetPasswordViewProps {
  token: string;
}

// View: só renderiza, delegando toda a lógica ao ViewModel.
export function ResetPasswordView({ token }: ResetPasswordViewProps) {
  const { isSubmitting, error, verified, verifyCode, submitPassword } =
    useResetPasswordViewModel(token);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="border-border bg-card shadow-sakura-900/5 w-full max-w-sm rounded-[2rem] border p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Image
            src="/logos/logo-sakura-oficial.png"
            alt="Sakura"
            width={135}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
          <h1 className="text-foreground text-2xl font-semibold">Redefinir senha</h1>
          <p className="text-muted-foreground text-sm">
            {verified
              ? "Defina sua nova senha."
              : "Digite o código de 6 dígitos que enviamos por e-mail."}
          </p>
        </div>

        <ResetPasswordForm
          verified={verified}
          isSubmitting={isSubmitting}
          error={error}
          onVerifyCode={verifyCode}
          onSubmitPassword={submitPassword}
        />
      </div>
    </div>
  );
}
