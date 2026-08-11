import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { UserCog } from "lucide-react";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { labelPapelSignatarioPadrao } from "@/modules/admin/utils/papel-signatario-padrao.util";
import {
  reordenarSignatariosPadraoAction,
  removerSignatarioPadraoAction,
  restaurarSignatarioPadraoAction,
} from "./actions";
import { SignatariosPadraoDragList } from "./signatarios-padrao-drag-list";

// Quem assina o contrato pela Sakura é sensível o bastante pra ficar
// restrito a Admin/Diretor (decisão do usuário, 2026-07-31) — mesmo padrão
// de /gestores e /bases.
const CARGOS_GESTAO_DE_SIGNATARIOS = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function SignatariosPadraoPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_SIGNATARIOS.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const signatarios = await cadastroAdminController.listarSignatariosPadrao();
  // Já vem ordenado por estágio asc (ver PrismaSignatarioPadraoRepository) —
  // a ordem de `ativos` É a fila de assinatura real, arrastável abaixo.
  const ativos = signatarios.filter((signatario) => signatario.ativo);
  const removidos = signatarios.filter((signatario) => !signatario.ativo);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserCog className="text-primary size-5" />
          <div>
            <h1 className="text-foreground text-lg font-bold">Signatários do Contrato</h1>
            <p className="text-muted-foreground text-sm">
              Signatários fixos da Sakura que participam da segunda parte da assinatura do contrato
              (depois dos sócios) — aprovador, testemunhas etc. Arraste pra reordenar a fila de
              assinatura. Ver docs/d4sign.md.
            </p>
          </div>
        </div>
        <Link
          href="/cadastros/signatarios-padrao/novo"
          className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
        >
          + Novo signatário
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-sm font-bold">Fila de assinatura</h2>
        <SignatariosPadraoDragList
          signatarios={ativos.map((signatario) => ({
            id: signatario.id,
            nome: signatario.nome,
            email: signatario.email,
            papel: signatario.papel,
          }))}
          reordenarAction={reordenarSignatariosPadraoAction}
          removerAction={removerSignatarioPadraoAction}
        />
      </div>

      {removidos.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-sm font-bold">Removidos</h2>
          <div className="border-border bg-card overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-border bg-muted/40 border-b">
                  <tr>
                    <th className="text-muted-foreground px-4 py-2.5 font-medium">Nome</th>
                    <th className="text-muted-foreground px-4 py-2.5 font-medium">E-mail</th>
                    <th className="text-muted-foreground px-4 py-2.5 font-medium">Papel</th>
                    <th className="text-muted-foreground px-4 py-2.5 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {removidos.map((signatario) => (
                    <tr key={signatario.id} className="border-border border-b last:border-0">
                      <td className="px-4 py-3">
                        <span className="text-foreground font-medium">
                          {signatario.nome ?? "—"}
                        </span>
                        {signatario.cargo ? (
                          <p className="text-muted-foreground text-xs">{signatario.cargo}</p>
                        ) : null}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">{signatario.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                          {labelPapelSignatarioPadrao(signatario.papel)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={`/cadastros/signatarios-padrao/${signatario.id}`}
                            className="text-primary text-xs font-semibold hover:underline"
                          >
                            Editar
                          </Link>
                          <form action={restaurarSignatarioPadraoAction.bind(null, signatario.id)}>
                            <button
                              type="submit"
                              className="text-success text-xs font-semibold hover:underline"
                            >
                              Reativar
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
