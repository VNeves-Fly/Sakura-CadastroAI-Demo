import Link from "next/link";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { eventosAdminController } from "@/modules/eventos/presentation/controllers/eventos-admin.controller";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { labelStatus, classesBadgeStatus } from "@/modules/admin/utils/status-cadastro.util";
import { GraficoOrigemContrato } from "@/modules/admin/components/grafico-origem-contrato";
import { GraficoContratosPorDia } from "@/modules/admin/components/grafico-contratos-por-dia";
import {
  STATUS_EM_ANALISE,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

interface CadastrosPageProps {
  searchParams: {
    busca?: string;
    status?: string;
    sort?: string;
    dir?: string;
    executivo?: string;
    associacao?: string;
    evento?: string;
  };
}

// Filas clicáveis — ciclo completo de estados (decisão do usuário,
// 2026-07-16; "em_analise" adicionado em 2026-07-24 quando o envio do
// cadastro passou a persistir antes da IA rodar): o cadastro é
// persistido assim que enviado ("em_analise") e a IA avalia depois, em
// background; se reprovar (ou a análise falhar tecnicamente) vai pra
// "em_complementar" (sem contrato ainda). Se aprovar (ou depois que o
// analista aprovar manualmente na fila Complementar), o contrato é
// gerado e cai em "aguardando_assinatura". Assinado, vira
// "aguardando_validacao" (analista confere o contrato assinado);
// validado, vira "aguardando_ativacao" (só falta SICA/Travel
// Link/Usuário Master + clicar ativar).
const FILAS = [
  {
    status: STATUS_EM_ANALISE,
    label: "Em análise (IA)",
    sublabel: "aguardando a IA avaliar",
  },
  { status: STATUS_EM_COMPLEMENTAR, label: "Em complementar", sublabel: "IA sinalizou revisão" },
  {
    status: STATUS_AGUARDANDO_ASSINATURA,
    label: "Aguardando assinatura",
    sublabel: "contrato enviado aos sócios",
  },
  {
    status: STATUS_AGUARDANDO_VALIDACAO,
    label: "Aguardando validação",
    sublabel: "contrato assinado, falta validar",
  },
  {
    status: STATUS_AGUARDANDO_ATIVACAO,
    label: "Aguardando ativação",
    sublabel: "falta SICA/Travel Link/ativar",
  },
];

const KPIS = [
  { chave: "emAnalise" as const, label: "Em análise (IA)" },
  { chave: "emComplementar" as const, label: "Em complementar" },
  { chave: "aguardandoAssinatura" as const, label: "Aguard. assinatura" },
  { chave: "aguardandoValidacao" as const, label: "Aguard. validação" },
  { chave: "aguardandoAtivacao" as const, label: "Aguard. ativação" },
  { chave: "ativas" as const, label: "Ativas" },
  { chave: "recusadas" as const, label: "Recusadas" },
];

const selectClassName =
  "border-input bg-background text-foreground focus:border-primary focus:ring-ring/30 rounded-full border px-4 py-2 text-sm outline-none focus:ring-2";

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
  return query ? `/painel?${query}` : "/painel";
}

function labelOrigemContrato(origem: "ia" | "humano" | null): string | null {
  if (origem === "ia") return "Contrato gerado pela IA";
  if (origem === "humano") return "Contrato gerado pelo analista";
  return null;
}

// Painel "IA x Atendimento Humano" / "Contratos por Dia" — pronto
// (componentes + query real), mas escondido do front por pedido do
// usuário (2026-07-16): vai ser usado mais pra frente, não entra em
// produção por enquanto. Reativar é só virar essa flag pra true.
const ANALISE_HABILITADA = false;

export default async function CadastrosPage({ searchParams }: CadastrosPageProps) {
  const sortBy = searchParams.sort === "razaoSocial" ? searchParams.sort : "createdAt";
  const sortDir = searchParams.dir === "asc" ? "asc" : "desc";

  const [{ items, total, kpis }, analise, promotores, associacoesTodas, eventosComLinks] =
    await Promise.all([
      cadastroAdminController.listarCadastros({
        busca: searchParams.busca,
        status: searchParams.status,
        sortBy,
        sortDir,
        executivoId: searchParams.executivo,
        associacaoId: searchParams.associacao,
        eventoId: searchParams.evento,
      }),
      ANALISE_HABILITADA ? cadastroAdminController.obterAnaliseContratos(14) : null,
      atribuicoesAdminController.listarPromotores(),
      atribuicoesAdminController.listarAssociacoes(),
      eventosAdminController.listarEventos(),
    ]);

  const executivosOpcoes = promotores.map((promotor) => ({ id: promotor.id, nome: promotor.nome }));
  const associacoesOpcoes = associacoesTodas
    .filter((associacao) => associacao.ativo)
    .map((associacao) => ({ id: associacao.id, nome: associacao.nome }));
  const eventosOpcoes = eventosComLinks.map(({ evento }) => ({ id: evento.id, nome: evento.nome }));

  return (
    <div className="flex flex-col gap-4">
      {/* Banner de boas-vindas — tom suave da marca (fundo claro + texto
          rosa escuro) em vez de fundo sólido saturado, pra não competir
          com os badges de status semânticos (revisão de tokens visuais). */}
      <div className="rounded-2xl bg-[#fdf1f7] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#72243e]">Cadastros</h1>
        <p className="mt-1 text-sm text-[#72243e]/75">
          Acompanhe o ciclo completo de onboarding das agências, da análise da IA até a ativação.
        </p>
      </div>

      {/* KPIs — informativos, contados direto da tabela agencias. Cartão
          único (sem cor por status, sem percentual) — o rótulo reserva
          altura fixa (2 linhas) pra o número ficar sempre alinhado entre
          os cards, mesmo quando um rótulo é mais curto que o outro. Sem
          card "Notificações" hoje: exigiria rastrear documento/mensagem
          novos desde a última vez que o analista "viu" a agência, o que
          não existe no schema ainda. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {KPIS.map((kpi) => (
          <div key={kpi.chave} className="rounded-xl bg-neutral-50 p-4">
            <span className="line-clamp-2 min-h-[2rem] text-xs font-medium tracking-wide text-neutral-500">
              {kpi.label}
            </span>
            <p className="mt-1 text-3xl font-bold text-neutral-900">{kpis[kpi.chave]}</p>
          </div>
        ))}
      </div>

      {/* Análise — IA x atendimento humano, fluxo de contratos por dia
          (assinados x pendentes). Dado real de Contrato.createdAt/status/
          signatarios, últimos 14 dias — nada estimado. Escondida por
          enquanto (ver ANALISE_HABILITADA acima). */}
      {ANALISE_HABILITADA && analise ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <GraficoOrigemContrato ia={analise.porOrigem.ia} humano={analise.porOrigem.humano} />
          <GraficoContratosPorDia porDia={analise.porDia} />
        </div>
      ) : null}

      {/* Filtros — busca textual + Executivo/Associação/Evento, todos via
          querystring (GET) num form só, mesmo padrão de /atribuicoes. */}
      <form
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
        action="/painel"
        method="GET"
      >
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
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 min-w-0 flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:ring-2"
        />
        <select
          name="executivo"
          defaultValue={searchParams.executivo ?? ""}
          className={selectClassName}
        >
          <option value="">Executivo</option>
          {executivosOpcoes.map((executivo) => (
            <option key={executivo.id} value={executivo.id}>
              {executivo.nome}
            </option>
          ))}
        </select>
        <select
          name="associacao"
          defaultValue={searchParams.associacao ?? ""}
          className={selectClassName}
        >
          <option value="">Associação</option>
          {associacoesOpcoes.map((associacao) => (
            <option key={associacao.id} value={associacao.id}>
              {associacao.nome}
            </option>
          ))}
        </select>
        <select name="evento" defaultValue={searchParams.evento ?? ""} className={selectClassName}>
          <option value="">Evento</option>
          {eventosOpcoes.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.nome}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-sakura-600 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
        >
          Filtrar
        </button>
      </form>

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
              <span className="text-muted-foreground text-xs font-medium tracking-wide">
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
                  <th className="text-muted-foreground px-4 py-2.5 font-medium">Associação</th>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(
                  ({ agencia, origemContratoAtual, associacaoNome, executivoNome, eventoNome }) => (
                    <tr key={agencia.id} className="border-border border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              href={`/painel/${agencia.id}`}
                              className="text-foreground hover:text-primary font-medium hover:underline"
                            >
                              {agencia.razaoSocial}
                            </Link>
                            <p className="text-muted-foreground text-xs">
                              {maskCnpj(agencia.cnpj)}
                            </p>
                          </div>
                          {eventoNome || executivoNome ? (
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              {eventoNome ? (
                                <span className="bg-accent text-accent-foreground rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">
                                  {eventoNome}
                                </span>
                              ) : null}
                              {executivoNome ? (
                                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap">
                                  {executivoNome}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {formatarData(agencia.createdAt)} · {diasAtras(agencia.createdAt)}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">{associacaoNome ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classesBadgeStatus(agencia.status)}`}
                          title={labelOrigemContrato(origemContratoAtual) ?? undefined}
                        >
                          {labelStatus(agencia.status)}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-xs">{total} agência(s) encontrada(s).</p>
    </div>
  );
}
