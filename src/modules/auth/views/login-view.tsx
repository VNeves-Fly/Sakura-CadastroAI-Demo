"use client";

import Image from "next/image";
import { useLoginViewModel } from "@/modules/auth/view-models/use-login.view-model";
import { LoginForm } from "@/modules/auth/components/login-form";

// View: só renderiza, delegando toda a lógica ao ViewModel.
export function LoginView() {
  const { isSubmitting, error, submit } = useLoginViewModel();

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
          <h1 className="text-foreground text-2xl font-semibold">Cadastro IA Sakura</h1>
          <p className="text-muted-foreground text-sm">
            Entre com suas credenciais para continuar.
          </p>
        </div>

        <LoginForm isSubmitting={isSubmitting} error={error} onSubmit={submit} />
      </div>
    </div>
  );
}
