"use client";

import { useLoginViewModel } from "@/modules/auth/view-models/use-login.view-model";
import { LoginForm } from "@/modules/auth/components/login-form";

// View: só renderiza, delegando toda a lógica ao ViewModel.
export function LoginView() {
  const { isSubmitting, error, submit } = useLoginViewModel();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Cadastro IA Sakura</h1>
        <p className="text-sm text-slate-500">Entre com suas credenciais para continuar.</p>
      </div>

      <LoginForm isSubmitting={isSubmitting} error={error} onSubmit={submit} />
    </div>
  );
}
