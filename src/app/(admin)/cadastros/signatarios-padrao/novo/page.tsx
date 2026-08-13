import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { SignatarioPadraoForm } from "../signatario-padrao-form";
import { criarSignatarioPadraoAction } from "../actions";

const CARGOS_GESTAO_DE_SIGNATARIOS = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function NovoSignatarioPadraoPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_SIGNATARIOS.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/cadastros/signatarios-padrao"
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          ← Voltar
        </Link>
        <h1 className="text-foreground text-lg font-bold">Novo signatário padrão</h1>
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <SignatarioPadraoForm action={criarSignatarioPadraoAction} />
      </div>
    </div>
  );
}
