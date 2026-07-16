import Link from "next/link";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { labelStatus, classesBadgeStatus } from "@/modules/admin/utils/status-cadastro.util";
import { GraficoOrigemContrato } from "@/modules/admin/components/grafico-origem-contrato";
import { GraficoContratosPorDia } from "@/modules/admin/components/grafico-contratos-por-dia";
import {
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

interface CadastrosPageProps {
  searchParams: {
    busca?: string;
    status?: string;
    sort?: string;
    dir?: string;
  };
}

// Filas clicáveis — ciclo completo de 6 estados (decisão do usuário,
// 2026-07-16): a IA avalia o cadastro no envio; se reprovar vai pra
// "em_complementar" (sem contrato ainda). Se aprovar (ou depois que o
// analista aprovar manualmente na fila Complementar), o contrato é
// gerado e cai em "aguardando_assinatura". Assinado, vira
// "aguardando_validacao" (analista confere o contrato assinado);
// validado, vira "aguardando_ativacao" (só falta SICA/Travel
// Link/Usuário Master + clicar ativar).
const FILAS = [
  { status: STATUS_EM_COMPLEMENTAR, label: "Em Complementar", sublabel: "IA sinalizou revisão" },
  {
    status: STATUS_AGUARDANDO_ASSINATURA,
    label: "Aguardando Assinatura",
    sublabel: "contrato enviado aos sócios",
  },
  {
    status: STATUS_AGUARDANDO_VALIDACAO,
    label: "Aguardando Validação",
    sublabel: "contrato assinado, falta validar",
  },
  {
    status: STATUS_AGUARDANDO_ATIVACAO,
    label: "Aguardando Ativação",
    sublabel: "falta SICA/Travel Link/ativar",
  },
];

const KPIS = [
  { chave: "emComplementar" as const, label: "Em Complementar" },
  { chave: "aguardandoAssinatura" as const, label: "Aguard. Assinatura" },
  { chave: "aguardandoValidacao" as const, label: "Aguard. Validação" },
  { chave: "aguardandoAtivacao" as const, label: "Aguard. Ativação" },
  { chave: "ativas" as const, label: "Ativas" },
  { chave: "recusadas" as const, label: "Recusadas" },
];

const COLUNAS_ORDENAVEIS = [
  { chave: "razaoSocial" as const, label: "Agência" },
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

function labelOrigemContrato(origem: "ia" | "humano" | null): string | null {
  if (origem === "ia") return "Contrato gerado pela IA";
  if (origem === "humano") return "Contrato gerado pelo analista";
  return null;
}

export default async function CadastrosPage({ searchParams }: CadastrosPageProps) {
  const sortBy = searchParams.sort === "razaoSocial" ? searchParams.sort : "createdAt";
  const sortDir = searchParams.dir === "asc" ? "asc" : "desc";

  const [{ items, total, kpis }, analise] = await Promise.all([
    cadastroAdminController.listarCadastros({
      busca: searchParams.busca,
      status: searchParams.status,
      sortBy,
      sortDir,
    }),
    cadastroAdminController.obterAnaliseContratos(14),
  ]);

  const totalGeral = Object.values(kpis).reduce((soma, valor) => soma + valor, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Banner de boas-vindas — estilo do print de referência
          (mapa-redesign-sakura.html): gradiente sólido na cor da marca. */}
      <div className="from-primary to-sakura-700 text-primary-foreground rounded-2xl bg-gradient-to-br p-6 shadow-lg">
        <h1 className="text-xl font-bold">Cadastros</h1>
        <p className="text-primary-foreground/80 mt-1 text-sm">
          Acompanhe o ciclo completo de onboarding das agências, da análise da IA até a ativação.
        </p>
      </div>

      {/* KPIs — informativos, contados direto da tabela agencias. Cada
          card mostra % do total geral + barra de progresso (dado real,
          não decorativo). Sem card "Notificações" hoje: exigiria
          rastrear documento/mensagem novos desde a última vez que o
          analista "viu" a agência, o que não existe no schema ainda. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {KPIS.map((kpi) => {
          const valor = kpis[kpi.chave];
          const percentual = totalGeral > 0 ? Math.round((valor / totalGeral) * 100) : 0;
          const statusEquivalente =
            kpi.chave === "emComplementar"
              ? STATUS_EM_COMPLEMENTAR
              : kpi.chave === "aguardandoAssinatura"
                ? STATUS_AGUARDANDO_ASSINATURA
                : kpi.chave === "aguardandoValidacao"
                  ? STATUS_AGUARDANDO_VALIDACAO
                  : kpi.chave === "aguardandoAtivacao"
                    ? STATUS_AGUARDANDO_ATIVACAO
                    : kpi.chave === "ativas"
                      ? STATUS_ATIVO
                      : STATUS_RECUSADO;
          const cores = classesBadgeStatus(statusEquivalente);
          const corBarra = cores.split(" ")[1] ?? "text-foreground";

          return (
            <div key={kpi.chave} className={`rounded-xl p-4 shadow-sm ${cores.split(" ")[0]}`}>
              <span className="text-xs font-medium tracking-wide uppercase opacity-70">
                {kpi.label}
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <p className={`text-3xl font-bold ${corBarra}`}>{valor}</p>
                <span className="text-xs font-medium opacity-70">{percentual}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-black/5">
                <div
                  className={`h-1.5 rounded-full ${corBarra.replace("text-", "bg-")}`}
                  style={{ width: `${percentual}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Análise — IA x atendimento humano, fluxo de contratos por dia
          (assinados x pendentes). Dado real de Contrato.createdAt/status/
          signatarios, últimos 14 dias — nada estimado. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <GraficoOrigemContrato ia={analise.porOrigem.ia} humano={analise.porOrigem.humano} />
        <GraficoContratosPorDia porDia={analise.porDia} />
      </div>

      {/* Filtros. Executivo/Associação/Evento existem no produto original,
          mas exigem conceitos (executivoId, associacaoId) que não existem
          no schema atual — ficam desabilitados até essa modelagem ser
          feita pelo backend. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex-1" action="/cadastros" method="GET">
          {searchParams.status ? (
            <input type="hidden" name="status" value={searchParams.status} />
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
            className="border-input bg-muted text-muted-foreground cursor-not-allowed rounded-full border px-3 py-2 text-sm"
          >
            <option>Executivo</option>
          </select>
          <select
            disabled
            className="border-input bg-muted text-muted-foreground cursor-not-allowed rounded-full border px-3 py-2 text-sm"
          >
            <option>Associação</option>
          </select>
          <select
            disabled
            className="border-input bg-muted text-muted-foreground cursor-not-allowed rounded-full border px-3 py-2 text-sm"
          >
            <option>Evento</option>
          </select>
        </div>
      </div>

      {/* Filas — clicar filtra a lista por aquele status; clicar de novo
          na mesma remove o filtro. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {FILAS.map((fila) => {
          const ativa = searchParams.status === fila.status;
          return (
            <Link
              key={fila.status}
              href={construirHref(searchParams, { status: ativa ? undefined : fila.status })}
              className={`rounded-xl border px-4 py-3 shadow-sm transition ${
                ativa ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {fila.label}
              </span>
              <p className="text-muted-foreground mt-1 text-xs">{fila.sublabel}</p>
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
                {items.map(({ agencia, origemContratoAtual }) => (
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
                    <td className="text-muted-foreground px-4 py-3">
                      {formatarData(agencia.createdAt)} · {diasAtras(agencia.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classesBadgeStatus(agencia.status)}`}
                        title={labelOrigemContrato(origemContratoAtual) ?? undefined}
                      >
                        {labelStatus(agencia.status)}
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
