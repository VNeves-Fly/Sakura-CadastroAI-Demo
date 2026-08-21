import Image from "next/image";
import { ConfirmarBiometriaForm } from "./confirmar-biometria-form";

// Página pública (sem login — token opaco na URL + confirmação de CPF,
// ver actions.ts) que conduz o sócio pela verificação de biometria facial
// (Legitimuz) e, depois de aprovada, entrega o link de assinatura do
// D4Sign. Não valida o token aqui: sem o CPF não dá pra distinguir "token
// não existe" de "token existe mas expirou" sem também exigir o CPF, então
// a confirmação (e qualquer mensagem de erro) acontece só na Server Action
// — ver docs/legitimuz/.
export default function BiometriaPage({ params }: { params: { token: string } }) {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center gap-6 px-4 py-10">
      <div className="border-border bg-card shadow-sakura-900/5 w-full max-w-md rounded-[2rem] border p-6 shadow-xl sm:p-10">
        <div className="mb-6 flex items-center justify-center">
          <Image
            src="/logos/logo-sakura-oficial.png"
            alt="Sakura Consolidadora"
            width={140}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

        <h1 className="text-foreground text-center text-lg font-semibold">
          Verificação de biometria facial
        </h1>
        <p className="text-muted-foreground mt-1 text-center text-sm">
          Confirmação de identidade antes da assinatura do contrato.
        </p>

        <ConfirmarBiometriaForm token={params.token} />
      </div>
    </div>
  );
}
