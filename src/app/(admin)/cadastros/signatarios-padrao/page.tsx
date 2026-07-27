import Link from "next/link";
import { UserCog } from "lucide-react";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { labelPapelSignatarioPadrao } from "@/modules/admin/utils/papel-signatario-padrao.util";
import { removerSignatarioPadraoAction, restaurarSignatarioPadraoAction } from "./actions";

export default async function SignatariosPadraoPage() {
  const signatarios = await cadastroAdminController.listarSignatariosPadrao();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserCog className="text-primary size-5" />
          <div>
            <h1 className="text-foreground text-lg font-bold">Signatários Padrão</h1>
            <p className="text-muted-foreground text-sm">
              Signatários fixos da Sakura que participam da segunda parte da assinatura do contrato
              (depois dos sócios) — aprovador, testemunhas etc. Ver docs/d4sign.md.
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

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        {signatarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
            <p className="text-foreground text-sm font-medium">
              Nenhum signatário padrão cadastrado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-border bg-muted/40 border-b">
                <tr>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium">Nome</th>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium">E-mail</th>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium">Papel</th>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium">Estágio</th>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium">Status</th>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {signatarios.map((signatario) => (
                  <tr key={signatario.id} className="border-border border-b last:border-0">
                    <td className="px-4 py-3">
                      <span className="text-foreground font-medium">{signatario.nome ?? "—"}</span>
                      {signatario.cargo ? (
                        <p className="text-muted-foreground text-xs">{signatario.cargo}</p>
                      ) : null}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">{signatario.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {labelPapelSignatarioPadrao(signatario.papel)}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">{signatario.estagio}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          signatario.ativo
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {signatario.ativo ? "Ativo" : "Removido"}
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
                        {signatario.ativo ? (
                          <form action={removerSignatarioPadraoAction.bind(null, signatario.id)}>
                            <button
                              type="submit"
                              className="text-destructive text-xs font-semibold hover:underline"
                            >
                              Remover
                            </button>
                          </form>
                        ) : (
                          <form action={restaurarSignatarioPadraoAction.bind(null, signatario.id)}>
                            <button
                              type="submit"
                              className="text-success text-xs font-semibold hover:underline"
                            >
                              Reativar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
