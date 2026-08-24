import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import type { DisparoEmail } from "@/modules/shared/domain/enums";

// Auditoria de todo e-mail enviado pelo sistema — dado sensível o
// bastante (corpo pode conter dados de sócio/CPF, ver detalhe) pra ficar
// restrito a Admin/Diretor, mesmo guard de /cadastros/signatarios-padrao.
const CARGOS_GESTAO_DE_LOGS = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

const TAMANHO_PAGINA = 30;

interface LogsEmailPageProps {
  searchParams: {
    destinatario?: string;
    disparo?: string;
    sucesso?: string;
    page?: string;
  };
}

function construirHref(
  searchParams: LogsEmailPageProps["searchParams"],
  patch: Record<string, string | undefined>,
): string {
  const combinado: Record<string, string | undefined> = { ...searchParams, ...patch };
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(combinado)) {
    if (valor) params.set(chave, valor);
  }
  const query = params.toString();
  return `/cadastros/logs-email${query ? `?${query}` : ""}`;
}

function BadgeDisparo({ disparo }: { disparo: DisparoEmail }) {
  const classes =
    disparo === "automatico" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {disparo === "automatico" ? "Automático" : "Manual"}
    </span>
  );
}

function BadgeStatus({ sucesso }: { sucesso: boolean }) {
  const classes = sucesso
    ? "bg-success-bg text-success-text"
    : "bg-destructive-bg text-destructive-text";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {sucesso ? "Enviado" : "Falhou"}
    </span>
  );
}

export default async function LogsEmailPage({ searchParams }: LogsEmailPageProps) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_LOGS.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const paginaAtual = Math.max(1, Math.trunc(Number(searchParams.page)) || 1);
  const disparo =
    searchParams.disparo === "manual" || searchParams.disparo === "automatico"
      ? searchParams.disparo
      : undefined;
  const sucesso =
    searchParams.sucesso === "true" ? true : searchParams.sucesso === "false" ? false : undefined;

  const { items, total } = await cadastroAdminController.listarEmailLogs({
    destinatario: searchParams.destinatario || undefined,
    disparo,
    sucesso,
    page: paginaAtual,
    pageSize: TAMANHO_PAGINA,
  });

  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Mail className="text-primary size-5" />
        <div>
          <h1 className="text-foreground text-lg font-bold">Logs de e-mail</h1>
          <p className="text-muted-foreground text-sm">
            Todo e-mail enviado pelo sistema — inclui os de solicitação de documento, lembretes e
            notificações de status do cadastro.
          </p>
        </div>
      </div>

      <form
        method="get"
        className="border-border bg-card flex flex-wrap items-end gap-3 rounded-2xl border p-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="destinatario" className="text-muted-foreground text-xs font-medium">
            Destinatário
          </label>
          <input
            id="destinatario"
            name="destinatario"
            type="text"
            defaultValue={searchParams.destinatario ?? ""}
            placeholder="email@exemplo.com"
            className="border-input bg-background rounded-lg border px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="disparo" className="text-muted-foreground text-xs font-medium">
            Disparo
          </label>
          <select
            id="disparo"
            name="disparo"
            defaultValue={searchParams.disparo ?? ""}
            className="border-input bg-background rounded-lg border px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="manual">Manual</option>
            <option value="automatico">Automático</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sucesso" className="text-muted-foreground text-xs font-medium">
            Status
          </label>
          <select
            id="sucesso"
            name="sucesso"
            defaultValue={searchParams.sucesso ?? ""}
            className="border-input bg-background rounded-lg border px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="true">Enviado</option>
            <option value="false">Falhou</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-4 py-2 text-sm font-semibold transition"
        >
          Filtrar
        </button>
      </form>

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-muted/40 border-b">
              <tr>
                <th className="text-muted-foreground px-4 py-2.5 font-medium">Enviado em</th>
                <th className="text-muted-foreground px-4 py-2.5 font-medium">Destinatário</th>
                <th className="text-muted-foreground px-4 py-2.5 font-medium">Agência</th>
                <th className="text-muted-foreground px-4 py-2.5 font-medium">Origem</th>
                <th className="text-muted-foreground px-4 py-2.5 font-medium">Disparo</th>
                <th className="text-muted-foreground px-4 py-2.5 font-medium">Status</th>
                <th className="text-muted-foreground px-4 py-2.5 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                    Nenhum e-mail encontrado com esses filtros.
                  </td>
                </tr>
              ) : (
                items.map(({ log, agenciaRazaoSocial }) => (
                  <tr key={log.id} className="border-border border-b last:border-0">
                    <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                      {new Date(log.enviadoEm).toLocaleString("pt-BR")}
                    </td>
                    <td className="text-foreground px-4 py-3">{log.destinatario}</td>
                    <td className="text-muted-foreground px-4 py-3">{agenciaRazaoSocial ?? "—"}</td>
                    <td className="text-muted-foreground px-4 py-3">{log.origem}</td>
                    <td className="px-4 py-3">
                      <BadgeDisparo disparo={log.disparo} />
                    </td>
                    <td className="px-4 py-3">
                      <BadgeStatus sucesso={log.sucesso} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/cadastros/logs-email/${log.id}`}
                        className="text-primary text-xs font-semibold hover:underline"
                      >
                        Ver e-mail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-muted-foreground text-xs">{total} e-mail(s) encontrado(s)</p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <Link
              href={construirHref(searchParams, { page: String(paginaAtual - 1) })}
              aria-disabled={paginaAtual === 1}
              className={`border-input rounded-full border p-1.5 transition ${
                paginaAtual === 1 ? "pointer-events-none opacity-40" : "hover:bg-accent"
              }`}
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={construirHref(searchParams, { page: String(paginaAtual + 1) })}
              aria-disabled={paginaAtual === totalPaginas}
              className={`border-input rounded-full border p-1.5 transition ${
                paginaAtual === totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-accent"
              }`}
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
