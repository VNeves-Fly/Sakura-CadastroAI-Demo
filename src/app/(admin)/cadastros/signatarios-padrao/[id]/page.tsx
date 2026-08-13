import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { SignatarioPadraoForm } from "../signatario-padrao-form";
import {
  atualizarSignatarioPadraoAction,
  removerSignatarioPadraoAction,
  restaurarSignatarioPadraoAction,
} from "../actions";

const CARGOS_GESTAO_DE_SIGNATARIOS = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function EditarSignatarioPadraoPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_SIGNATARIOS.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const signatario = await cadastroAdminController.obterSignatarioPadrao(params.id);

  if (!signatario) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/cadastros/signatarios-padrao"
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ← Voltar
          </Link>
          <h1 className="text-foreground text-lg font-bold">
            Editar signatário — {signatario.nome ?? signatario.email}
          </h1>
        </div>

        {signatario.ativo ? (
          <form action={removerSignatarioPadraoAction.bind(null, signatario.id)}>
            <button
              type="submit"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-full border px-4 py-2 text-sm font-medium transition"
            >
              Remover
            </button>
          </form>
        ) : (
          <form action={restaurarSignatarioPadraoAction.bind(null, signatario.id)}>
            <button
              type="submit"
              className="border-success/40 text-success hover:bg-success/10 rounded-full border px-4 py-2 text-sm font-medium transition"
            >
              Reativar
            </button>
          </form>
        )}
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <SignatarioPadraoForm
          signatario={signatario}
          action={atualizarSignatarioPadraoAction.bind(null, signatario.id)}
        />
      </div>
    </div>
  );
}
