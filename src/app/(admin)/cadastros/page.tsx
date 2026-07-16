import Link from "next/link";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";

interface CadastrosPageProps {
  searchParams: {
    busca?: string;
    etapa?: string;
    sort?: string;
    dir?: string;
  };
}

const FUNIL_ETAPAS = [
  { numero: 1, label: "Análise", sublabel: "ficha em análise", chave: "etapa1" as const },
  { numero: 2, label: "Complementar", sublabel: "docs e complemento", chave: "etapa2" as const },
  { numero: 3, label: "Contrato", sublabel: "em assinatura", chave: "etapa3" as const },
  { numero: 4, label: "Usuário Master", sublabel: "criar credenciais", chave: "etapa4" as const },
];

const COLUNAS_ORDENAVEIS = [
  { chave: "razaoSocial" as const, label: "Agência" },
  { chave: "etapaAtual" as const, label: "Etapa" },
  { chave: "createdAt" as const, label: "Cadastro" },
];

function diasAtras(data: Date): string {
  const dias = Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "hoje";
  if (dias === 1) return "1d atrás";
  return `${dias}d atrás`;
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(data);
}

function construirHref(
  searchParams: CadastrosPageProps["searchParams"],
  patch: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  const combinado = { ...searchParams, ...patch };
  for (const [chave, valor] of Object.entries(combinado)) {
    if (valor) params.set(chave, valor);
  }
  const query = params.toString();
  return query ? `/cadastros?${query}` : "/cadastros";
}

export default async function CadastrosPage({ searchParams }: CadastrosPageProps) {
  const etapaFiltro = searchParams.etapa ? Number(searchParams.etapa) : undefined;
  const sortBy =
    searchParams.sort === "etapaAtual" || searchParams.sort === "razaoSocial"
      ? searchParams.sort
      : "createdAt";
  const sortDir = searchParams.dir === "asc" ? "asc" : "desc";

  const { items, total, kpis, funil } = await cadastroAdminController.listarCadastros({
    busca: searchParams.busca,
    etapa: etapaFiltro,
    sortBy,
    sortDir,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs — informativos, contados direto da tabela agencias. Sem
          coluna "Notificações" hoje: exigiria rastrear documento/mensagem
          novos desde a última vez que o analista "viu" a agência, o que
          não existe no schema ainda. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-l-primary border-border bg-card rounded-xl border-y border-r border-l-4 px-4 py-3 shadow-sm">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Em Análise
          </span>
          <p className="text-foreground text-3xl font-bold">{kpis.emAnalise}</p>
        </div>
        <div className="border-destructive/30 bg-destructive/5 rounded-xl border px-4 py-3 shadow-sm">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Reprovadas
          </span>
          <p className="text-destructive text-3xl font-bold">{kpis.reprovadas}</p>
        </div>
        <div className="border-success/30 bg-success/5 rounded-xl border px-4 py-3 shadow-sm">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Aprovadas
          </span>
          <p className="text-success text-3xl font-bold">{kpis.aprovadas}</p>
        </div>
        <div className="border-warning/30 bg-warning/5 rounded-xl border px-4 py-3 shadow-sm">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Aguard. Aprovação Final
          </span>
          <p className="text-warning text-3xl font-bold">{kpis.aguardandoAprovacaoFinal}</p>
        </div>
      </div>

      {/* Filtros. Executivo/Associação/Evento existem no produto original,
          mas exigem conceitos (executivoId, associacaoId) que não existem
          no schema atual — ficam desabilitados até essa modelagem ser
          feita pelo backend. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex-1" action="/cadastros" method="GET">
          {searchParams.etapa ? (
            <input type="hidden" name="etapa" value={searchParams.etapa} />
          ) : null}
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
        <div className="flex gap-2">
          <select
            disabled
            className="border-input bg-muted text-muted-foreground rounded-full border px-3 py-2 text-sm disabled:cursor-not-allowed"
          >
            <option>Executivo</option>
          </select>
          <select
            disabled
            className="border-input bg-muted text-muted-foreground rounded-full border px-3 py-2 text-sm disabled:cursor-not-allowed"
          >
            <option>Associação</option>
          </select>
          <select
            disabled
            className="border-input bg-muted text-muted-foreground rounded-full border px-3 py-2 text-sm disabled:cursor-not-allowed"
          >
            <option>Evento</option>
          </select>
        </div>
      </div>

      {/* Funil de Etapas — clicar filtra a lista por aquela etapa; clicar
          de novo na mesma remove o filtro. Etapa 5 (Aprovado) não entra
          aqui — sai da listagem assim que a agência é arquivada. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FUNIL_ETAPAS.map((etapa) => {
          const ativa = etapaFiltro === etapa.numero;
          return (
            <Link
              key={etapa.numero}
              href={construirHref(searchParams, {
                etapa: ativa ? undefined : String(etapa.numero),
              })}
              className={`rounded-xl border px-4 py-3 shadow-sm transition ${
                ativa ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Etapa {etapa.numero} · {etapa.label}
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-muted-foreground text-xs">{etapa.sublabel}</span>
                <span className="text-foreground text-lg font-bold">{funil[etapa.chave]}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tabela principal */}
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
                {items.map((agencia) => (
                  <tr key={agencia.id} className="border-border border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/cadastros/${agencia.id}`}
                        className="text-foreground hover:text-primary font-medium hover:underline"
                      >
                        {agencia.razaoSocial}
                      </Link>
                      <p className="text-muted-foreground text-xs">{maskCnpj(agencia.cnpj)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-muted text-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                        Etapa {agencia.etapaAtual}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {formatarData(agencia.createdAt)} · {diasAtras(agencia.createdAt)}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">{agencia.status}</td>
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
