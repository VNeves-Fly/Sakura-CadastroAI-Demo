"use client";

import Image from "next/image";
import Link from "next/link";
import { useForgotPasswordViewModel } from "@/modules/auth/view-models/use-forgot-password.view-model";
import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";

// View: só renderiza, delegando toda a lógica ao ViewModel.
export function ForgotPasswordView() {
  const { isSubmitting, error, submitted, submit } = useForgotPasswordViewModel();

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
          <h1 className="text-foreground text-2xl font-semibold">Recuperar senha</h1>
          <p className="text-muted-foreground text-sm">
            Informe seu e-mail e enviaremos um código de verificação.
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-foreground text-sm">
              Se o e-mail informado estiver cadastrado, você vai receber um código de verificação em
              instantes.
            </p>
            <Link href="/login" className="text-primary text-sm font-medium hover:underline">
              Voltar pro login
            </Link>
          </div>
        ) : (
          <>
            <ForgotPasswordForm isSubmitting={isSubmitting} error={error} onSubmit={submit} />
            <p className="text-muted-foreground mt-4 text-center text-sm">
              <Link href="/login" className="text-primary font-medium hover:underline">
                Voltar pro login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
