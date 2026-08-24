import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";

const CARGOS_GESTAO_DE_LOGS = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function LogEmailDetalhePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_LOGS.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const log = await cadastroAdminController.obterEmailLog(params.id);
  if (!log) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/cadastros/logs-email"
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Voltar pros logs
      </Link>

      <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
        <h1 className="text-foreground text-lg font-bold">{log.assunto}</h1>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-muted-foreground font-medium">Destinatário:</dt>
            <dd className="text-foreground">{log.destinatario}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground font-medium">Enviado em:</dt>
            <dd className="text-foreground">{new Date(log.enviadoEm).toLocaleString("pt-BR")}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground font-medium">Origem:</dt>
            <dd className="text-foreground">{log.origem}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground font-medium">Disparo:</dt>
            <dd className="text-foreground">
              {log.disparo === "automatico" ? "Automático" : "Manual"}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground font-medium">Status:</dt>
            <dd className={log.sucesso ? "text-success-text" : "text-destructive-text"}>
              {log.sucesso ? "Enviado" : "Falhou"}
            </dd>
          </div>
          {log.erro ? (
            <div className="flex gap-2 sm:col-span-2">
              <dt className="text-muted-foreground font-medium">Erro:</dt>
              <dd className="text-destructive-text">{log.erro}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <div className="border-border bg-muted/40 border-b px-4 py-2.5">
          <p className="text-muted-foreground text-xs font-medium">
            Pré-visualização (renderizada como o destinatário recebeu)
          </p>
        </div>
        <iframe title="Corpo do e-mail" srcDoc={log.corpo} sandbox="" className="h-[70vh] w-full" />
      </div>
    </div>
  );
}
