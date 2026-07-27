import Link from "next/link";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { classesBadgeStatus } from "@/modules/admin/utils/status-cadastro.util";
import { labelStatusArquivo } from "@/modules/admin/utils/status-arquivo.util";
import {
  STATUS_ATIVO,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

// Arquivo = destino final das agências depois que saem do funil de
// onboarding (ver /cadastros) — só 2 abas, sem fila intermediária: Ativas e
// Reprovadas. Nenhum outro status entra aqui.
const ABAS = [
  { chave: "ativas", label: "Ativas", status: STATUS_ATIVO },
  { chave: "reprovadas", label: "Reprovadas", status: STATUS_RECUSADO },
] as const;

interface ArquivoPageProps {
  searchParams: {
    aba?: string;
    busca?: string;
    sort?: string;
    dir?: string;
  };
}

const COLUNAS_ORDENAVEIS = [
  { chave: "razaoSocial" as const, label: "Agência" },
  { chave: "createdAt" as const, label: "Cadastro" },
];

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(data);
}

function construirHref(
  searchParams: ArquivoPageProps["searchParams"],
  patch: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  const combinado = { ...searchParams, ...patch };
  for (const [chave, valor] of Object.entries(combinado)) {
    if (valor) params.set(chave, valor);
  }
  const query = params.toString();
  return query ? `/arquivo?${query}` : "/arquivo";
}

export default async function ArquivoPage({ searchParams }: ArquivoPageProps) {
  const abaAtual = ABAS.find((aba) => aba.chave === searchParams.aba) ?? ABAS[0];
  const sortBy = searchParams.sort === "razaoSocial" ? searchParams.sort : "createdAt";
  const sortDir = searchParams.dir === "asc" ? "asc" : "desc";

  // kpis vem sempre com a contagem de todos os status (não só o
  // filtrado) — reaproveitado só pra mostrar o total de cada aba, sem
  // precisar de uma segunda query.
  const { items, total, kpis } = await cadastroAdminController.listarCadastros({
    busca: searchParams.busca,
    status: abaAtual.status,
    sortBy,
    sortDir,
  });
  const contadorPorAba: Record<(typeof ABAS)[number]["chave"], number> = {
    ativas: kpis.ativas,
    reprovadas: kpis.recusadas,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-[#fdf1f7] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#72243e]">Arquivo</h1>
        <p className="mt-1 text-sm text-[#72243e]/75">
          Agências que já concluíram o onboarding — ativas ou reprovadas.
        </p>
      </div>

      {/* Abas — só 2, sem fila intermediária (diferente do /cadastros). */}
      <div className="flex gap-2">
        {ABAS.map((aba) => {
          const ativa = aba.chave === abaAtual.chave;
          return (
            <Link
              key={aba.chave}
              href={construirHref(searchParams, {
                aba: aba.chave,
                sort: undefined,
                dir: undefined,
              })}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                ativa
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {aba.label} ({contadorPorAba[aba.chave]})
            </Link>
          );
        })}
      </div>

      <form className="flex-1" action="/arquivo" method="GET">
        <input type="hidden" name="aba" value={abaAtual.chave} />
        {searchParams.sort ? <input type="hidden" name="sort" value={searchParams.sort} /> : null}
        {searchParams.dir ? <input type="hidden" name="dir" value={searchParams.dir} /> : null}
        <input
          type="text"
          name="busca"
          defaultValue={searchParams.busca ?? ""}
          placeholder="Buscar por CNPJ, razão social ou e-mail"
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full rounded-full border px-4 py-2 text-sm outline-none focus:ring-2"
        />
      </form>

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
            <p className="text-foreground text-sm font-medium">Nenhuma agência encontrada.</p>
            <p className="text-muted-foreground text-xs">
              Tente outro termo, ou cole o CNPJ completo (14 dígitos).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-border bg-muted/40 border-b">
                <tr>
                  {COLUNAS_ORDENAVEIS.map((coluna) => {
                    const ativa = sortBy === coluna.chave;
                    const proximaDir = ativa && sortDir === "desc" ? "asc" : "desc";
                    return (
                      <th
                        key={coluna.chave}
                        className="text-muted-foreground px-4 py-2.5 font-medium"
                      >
                        <Link
                          href={construirHref(searchParams, {
                            sort: coluna.chave,
                            dir: proximaDir,
                          })}
                          className="hover:text-foreground flex items-center gap-1"
                        >
                          {coluna.label}
                          {ativa ? <span>{sortDir === "asc" ? "↑" : "↓"}</span> : null}
                        </Link>
                      </th>
                    );
                  })}
                  <th className="text-muted-foreground px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ agencia }) => (
                  <tr key={agencia.id} className="border-border border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/arquivo/${agencia.id}`}
                        className="text-foreground hover:text-primary font-medium hover:underline"
                      >
                        {agencia.razaoSocial}
                      </Link>
                      <p className="text-muted-foreground text-xs">{maskCnpj(agencia.cnpj)}</p>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {formatarData(agencia.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classesBadgeStatus(agencia.status)}`}
                      >
                        {labelStatusArquivo(agencia.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-xs">{total} agência(s) encontrada(s).</p>
    </div>
  );
}
