"use client";

import Image from "next/image";
import { useChangePasswordViewModel } from "@/modules/auth/view-models/use-change-password.view-model";
import { ChangePasswordForm } from "@/modules/auth/components/change-password-form";

// View: só renderiza, delegando toda a lógica ao ViewModel.
export function ChangePasswordView() {
  const { isSubmitting, error, submit } = useChangePasswordViewModel();

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
          <h1 className="text-foreground text-2xl font-semibold">Troque sua senha</h1>
          <p className="text-muted-foreground text-sm">
            Este é seu primeiro acesso. Defina uma nova senha para continuar.
          </p>
        </div>

        <ChangePasswordForm isSubmitting={isSubmitting} error={error} onSubmit={submit} />
      </div>
    </div>
  );
}
