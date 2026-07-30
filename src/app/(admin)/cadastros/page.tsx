import Link from "next/link";
import { UserCog } from "lucide-react";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { CadastrosLive } from "./cadastros-live";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { atendimentoController } from "@/modules/atendimento/presentation/controllers/atendimento.controller";
import { assumirAtendimentoDossieAction } from "./[id]/actions";
import { AtendimentoAgenciaAcoes } from "@/modules/atendimento/components/atendimento-agencia-acoes";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import {
  labelStatus,
  classesBadgeStatus,
  STATUS_LABELS,
} from "@/modules/admin/utils/status-cadastro.util";
import { GraficoOrigemContrato } from "@/modules/admin/components/grafico-origem-contrato";
import { GraficoContratosPorDia } from "@/modules/admin/components/grafico-contratos-por-dia";
import { FiltroCadastrosField } from "@/modules/admin/components/filtro-cadastros-field";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { OpcaoFiltroCadastros } from "@/modules/admin/types/filtro-cadastros.types";
import {
  STATUS_EM_ANALISE,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_ATIVO,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

interface CadastrosPageProps {
  searchParams: {
    busca?: string;
    status?: string;
    sort?: string;
    dir?: string;
    filtro?: string | string[];
  };
}

function paraArray(valor: string | string[] | undefined): string[] {
  if (!valor) return [];
  return Array.isArray(valor) ? valor : [valor];
}

// Categoria de cada opção do filtro único (ver FiltroCadastrosField) vem
// prefixada no próprio value (ex.: "base:SP") pra sobreviver ao roundtrip
// do form GET — aqui desfaz o prefixo pra montar os filtros da query.
function extrairCategoria(valores: string[], prefixo: string): string[] {
  const marca = `${prefixo}:`;
  return valores
    .filter((valor) => valor.startsWith(marca))
    .map((valor) => valor.slice(marca.length));
}

// Filas clicáveis — ciclo completo de estados (decisão do usuário,
// 2026-07-16; "em_analise" adicionado em 2026-07-24 quando o envio do
// cadastro passou a persistir antes da IA rodar; unificada com o KPI
// numérico em 2026-07-27, um card só por status): o cadastro é
// persistido assim que enviado ("em_analise") e a IA avalia depois, em
// background; se reprovar (ou a análise falhar tecnicamente) vai pra
// "em_complementar" (sem contrato ainda). Se aprovar (ou depois que o
// analista aprovar manualmente na fila Complementar), o contrato é
// gerado e cai em "aguardando_assinatura". Assinado, vira
// "aguardando_validacao" (analista confere o contrato assinado);
// validado, vira "aguardando_ativacao" (só falta SICA/Travel
// Link/Usuário Master + clicar ativar); ativado vira "ativo", ou a
// qualquer momento pode ser "recusado".
// Cor padrão por card (decisão do usuário, 2026-07-30): roxo pra "gerado
// pela IA" (análise), teal pra etapas conduzidas pelo analista
// (complementar/validação/ativação), verde pra ativo e vermelho pra
// recusado. "Aguardando assinatura" fica sem cor própria — o card não
// muda, só ganha um hover com o breakdown IA x analista (ver Tooltip
// abaixo, cores reaproveitadas: COR_ORIGEM_IA/COR_ORIGEM_HUMANO).
const COR_ORIGEM_IA = "#8A2BE2";
const COR_ORIGEM_HUMANO = "#008B8B";

const FILAS = [
  {
    status: STATUS_EM_ANALISE,
    chave: "emAnalise" as const,
    label: "Em análise (IA)",
    sublabel: "aguardando a IA avaliar",
    cor: COR_ORIGEM_IA,
  },
  {
    status: STATUS_EM_COMPLEMENTAR,
    chave: "emComplementar" as const,
    label: "Em complementar",
    sublabel: "IA sinalizou revisão",
    cor: COR_ORIGEM_HUMANO,
  },
  {
    status: STATUS_AGUARDANDO_ASSINATURA,
    chave: "aguardandoAssinatura" as const,
    label: "Aguardando assinatura",
    sublabel: "contrato enviado aos sócios",
    cor: null,
  },
  {
    status: STATUS_AGUARDANDO_VALIDACAO,
    chave: "aguardandoValidacao" as const,
    label: "Setor cadastro",
    sublabel: "contrato assinado, criar SICA e TravelLink",
    cor: COR_ORIGEM_HUMANO,
  },
  {
    status: STATUS_AGUARDANDO_ATIVACAO,
    chave: "aguardandoAtivacao" as const,
    label: "Setor comercial",
    sublabel: "Usuário master e ativar agência",
    cor: COR_ORIGEM_HUMANO,
  },
  {
    status: STATUS_ATIVO,
    chave: "ativas" as const,
    label: "Ativas",
    sublabel: "agência liberada e operando",
    cor: "#008000",
  },
  {
    status: STATUS_RECUSADO,
    chave: "recusadas" as const,
    label: "Recusadas",
    sublabel: "cadastro recusado",
    cor: "#DC143C",
  },
];

const COLUNAS_ORDENAVEIS = [
  { chave: "razaoSocial" as const, label: "Agência" },
  { chave: "createdAt" as const, label: "Cadastro" },
] as const;

function diasAtras(data: Date): string {
  const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((inicioDoDia(new Date()) - inicioDoDia(data)) / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `${dias}d atrás`;
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(data);
}

function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);
}

function construirHref(
  searchParams: CadastrosPageProps["searchParams"],
  patch: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  const combinado: Record<string, string | string[] | undefined> = { ...searchParams, ...patch };
  for (const [chave, valor] of Object.entries(combinado)) {
    if (!valor) continue;
    for (const item of Array.isArray(valor) ? valor : [valor]) {
      params.append(chave, item);
    }
  }
  const query = params.toString();
  return query ? `/cadastros?${query}` : "/cadastros";
}

function ThOrdenavel({
  coluna,
  sortBy,
  sortDir,
  searchParams,
}: {
  coluna: (typeof COLUNAS_ORDENAVEIS)[number];
  sortBy: string;
  sortDir: "asc" | "desc";
  searchParams: CadastrosPageProps["searchParams"];
}) {
  const ativa = sortBy === coluna.chave;
  const proximaDir = ativa && sortDir === "desc" ? "asc" : "desc";
  return (
    <th className="text-muted-foreground px-4 py-2.5 font-medium whitespace-nowrap">
      <Link
        href={construirHref(searchParams, { sort: coluna.chave, dir: proximaDir })}
        className="hover:text-foreground flex items-center gap-1"
      >
        {coluna.label}
        {ativa ? <span>{sortDir === "asc" ? "↑" : "↓"}</span> : null}
      </Link>
    </th>
  );
}

function labelOrigemContrato(origem: "ia" | "humano" | "externo" | null): string | null {
  if (origem === "ia") return "Contrato gerado pela IA";
  if (origem === "humano") return "Contrato gerado pelo analista";
  if (origem === "externo") return "Contrato registrado manualmente";
  return null;
}

// Painel "IA x Atendimento Humano" / "Contratos por Dia" — pronto
// (componentes + query real), mas escondido do front por pedido do
// usuário (2026-07-16): vai ser usado mais pra frente, não entra em
// produção por enquanto. Reativar é só virar essa flag pra true.
const ANALISE_HABILITADA = false;

export default async function CadastrosPage({ searchParams }: CadastrosPageProps) {
  const session = await getServerSession(nextAuthOptions);
  const analistaId = session?.user?.id ?? "";

  const sortBy = searchParams.sort === "razaoSocial" ? searchParams.sort : "createdAt";
  const sortDir = searchParams.dir === "asc" ? "asc" : "desc";

  // Filtro único (ver FiltroCadastrosField) — cada categoria vem
  // prefixada dentro de searchParams.filtro; Status também pode chegar
  // pelos cards de "Filas" (searchParams.status) — as duas fontes só se
  // combinam na query, sem sincronizar visualmente entre si.
  const valoresFiltro = paraArray(searchParams.filtro);
  const baseDoFiltro = extrairCategoria(valoresFiltro, "base");
  const gestorDoFiltro = extrairCategoria(valoresFiltro, "gestor");
  const executivoDoFiltro = extrairCategoria(valoresFiltro, "executivo");
  const associacaoDoFiltro = extrairCategoria(valoresFiltro, "associacao");
  const statusDoFiltro = extrairCategoria(valoresFiltro, "status");
  const statusCombinado = [...new Set([...paraArray(searchParams.status), ...statusDoFiltro])];

  const [{ items, total, kpis }, analise, promotores, associacoesTodas] = await Promise.all([
    cadastroAdminController.listarCadastros({
      busca: searchParams.busca,
      status: statusCombinado.length > 0 ? statusCombinado : undefined,
      sortBy,
      sortDir,
      executivoId: executivoDoFiltro,
      associacaoId: associacaoDoFiltro,
      base: baseDoFiltro,
      gestor: gestorDoFiltro,
    }),
    ANALISE_HABILITADA ? cadastroAdminController.obterAnaliseContratos(14) : null,
    atribuicoesAdminController.listarPromotores(),
    atribuicoesAdminController.listarAssociacoes(),
  ]);

  const associacoesAtivas = associacoesTodas.filter((associacao) => associacao.ativo);

  // Opções do filtro único, agrupadas por categoria na ordem em que devem
  // aparecer no dropdown — Base/Gestor derivados em memória (não existe
  // query dedicada, lista é pequena) a partir dos mesmos promotores já
  // buscados acima.
  const basesUnicas = [...new Set(promotores.flatMap((p) => p.bases))];
  const gestoresUnicos = [...new Set(promotores.map((p) => p.gestor).filter(Boolean))];
  const opcoesFiltro: OpcaoFiltroCadastros[] = [
    ...basesUnicas.map((base) => ({ value: `base:${base}`, label: base, categoria: "Base" })),
    ...gestoresUnicos.map((gestor) => ({
      value: `gestor:${gestor}`,
      label: gestor,
      categoria: "Gestor",
    })),
    ...promotores.map((promotor) => ({
      value: `executivo:${promotor.id}`,
      label: promotor.nome,
      categoria: "Executivo",
    })),
    ...associacoesAtivas.map((associacao) => ({
      value: `associacao:${associacao.id}`,
      label: associacao.nome,
      categoria: "Associação",
    })),
    ...Object.entries(STATUS_LABELS).map(([status, label]) => ({
      value: `status:${status}`,
      label,
      categoria: "Status",
    })),
  ];

  // Quem está atendendo cada agência agora, ou quem foi o último a
  // atender — buscado à parte do Promise.all acima porque depende dos ids
  // resolvidos por ele. Fonte é AtendimentoAgencia (responsabilidade sobre
  // a agência, não sobre uma conversa de WhatsApp — ver
  // atendimento-agencia-repository.ts), sempre no máximo 1 analista ativo
  // por agência, então não existe mais o caso "+N analistas" de antes
  // (quando a fonte era conversa e uma agência podia ter várias). O
  // encerrado só é usado como fallback quando não há ninguém atendendo.
  const agenciaIds = items.map(({ agencia }) => agencia.id);
  const [atendimentosAtivos, ultimosAtendimentosEncerrados] = await Promise.all([
    atendimentoController.listarAtendimentosAgenciaAtivos(agenciaIds),
    atendimentoController.listarUltimoAtendimentoAgenciaEncerrado(agenciaIds),
  ]);
  const atendimentoAtivoPorAgencia = new Map(
    atendimentosAtivos.map((registro) => [registro.agenciaId, registro]),
  );
  const ultimoEncerradoPorAgencia = new Map(
    ultimosAtendimentosEncerrados.map((registro) => [registro.agenciaId, registro]),
  );

  return (
    <div className="flex flex-col gap-4">
      <CadastrosLive />

      {/* Banner de boas-vindas — tom suave da marca (fundo claro + texto
          rosa escuro) em vez de fundo sólido saturado, pra não competir
          com os badges de status semânticos (revisão de tokens visuais). */}
      <div className="rounded-2xl bg-[#fdf1f7] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#72243e]">Cadastros</h1>
        <p className="mt-1 text-sm text-[#72243e]/75">
          Acompanhe o ciclo completo de onboarding das agências, da análise da IA até a ativação.
        </p>
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

      {/* Filtros — busca textual + campo único (Base/Gestor/Executivo/
          Associação/Status agrupados, ver FiltroCadastrosField), na
          mesma linha (decisão do usuário, 2026-07-27), via querystring
          (GET) num form só. */}
      <form
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
        action="/cadastros"
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
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 min-w-0 flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:ring-2"
        />
        <div className="w-full sm:w-80">
          <FiltroCadastrosField
            name="filtro"
            defaultValue={valoresFiltro}
            placeholder="Base, gestor, executivo, associação ou status"
            options={opcoesFiltro}
          />
        </div>
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-sakura-600 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
        >
          Filtrar
        </button>
      </form>

      {/* Filas — cartão único por status (KPI numérico + descrição
          unificados em 2026-07-27), numa linha só. Clicar filtra a lista
          por aquele status; clicar de novo na mesma remove o filtro.
          Largura mínima por card + shrink-0 força scroll horizontal em
          telas estreitas em vez de quebrar em várias linhas; em telas
          largas o flex-1 distribui o espaço sobrando igualmente. */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {FILAS.map((fila) => {
          const ativa = searchParams.status === fila.status;
          const cardClassName = `min-w-[168px] flex-1 shrink-0 rounded-xl border px-4 py-3 shadow-sm transition ${
            ativa ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/40"
          }`;
          const cardStyle = fila.cor
            ? { borderLeftColor: fila.cor, borderLeftWidth: 4 }
            : undefined;
          const cardConteudo = (
            <>
              <span className="text-muted-foreground line-clamp-2 min-h-[2rem] text-xs font-medium tracking-wide">
                {fila.label}
              </span>
              <p
                className={`mt-1 text-3xl font-bold ${fila.cor ? "" : "text-foreground"}`}
                style={fila.cor ? { color: fila.cor } : undefined}
              >
                {kpis[fila.chave]}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">{fila.sublabel}</p>
            </>
          );

          // Único card sem cor própria — em vez disso ganha um hover com o
          // breakdown de origem do contrato (IA x analista), já que o KPI
          // agregado do card não distingue as duas origens.
          if (fila.status === STATUS_AGUARDANDO_ASSINATURA) {
            const { ia, humano } = kpis.aguardandoAssinaturaPorOrigem;
            return (
              <Tooltip key={fila.status}>
                <TooltipTrigger
                  render={
                    <Link
                      href={construirHref(searchParams, {
                        status: ativa ? undefined : fila.status,
                      })}
                      className={cardClassName}
                    >
                      {cardConteudo}
                    </Link>
                  }
                />
                <TooltipContent>
                  <span style={{ color: COR_ORIGEM_IA }}>IA: {ia}</span>
                  {" · "}
                  <span style={{ color: COR_ORIGEM_HUMANO }}>Analista: {humano}</span>
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={fila.status}
              href={construirHref(searchParams, { status: ativa ? undefined : fila.status })}
              className={cardClassName}
              style={cardStyle}
            >
              {cardConteudo}
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
                  <ThOrdenavel
                    coluna={COLUNAS_ORDENAVEIS[0]}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    searchParams={searchParams}
                  />
                  <th className="text-muted-foreground px-4 py-2.5 font-medium whitespace-nowrap">
                    Atendimento
                  </th>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium whitespace-nowrap">
                    Status
                  </th>
                  <ThOrdenavel
                    coluna={COLUNAS_ORDENAVEIS[1]}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    searchParams={searchParams}
                  />
                  <th className="text-muted-foreground px-4 py-2.5 font-medium whitespace-nowrap">
                    Base
                  </th>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium whitespace-nowrap">
                    Executivo
                  </th>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium whitespace-nowrap">
                    Gestor
                  </th>
                  <th className="text-muted-foreground px-4 py-2.5 font-medium whitespace-nowrap">
                    Associação
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map(
                  ({
                    agencia,
                    origemContratoAtual,
                    associacaoNome,
                    executivoNome,
                    executivoBase,
                    executivoGestor,
                    eventoNome,
                  }) => {
                    const atendimentoAtivo = atendimentoAtivoPorAgencia.get(agencia.id);
                    const ultimoEncerrado = ultimoEncerradoPorAgencia.get(agencia.id);
                    return (
                      <tr key={agencia.id} className="border-border border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Link
                                href={`/cadastros/${agencia.id}`}
                                className="text-foreground hover:text-primary font-medium hover:underline"
                              >
                                {agencia.razaoSocial}
                              </Link>
                              <p className="text-muted-foreground text-xs">
                                {maskCnpj(agencia.cnpj)}
                              </p>
                            </div>
                            {eventoNome ? (
                              <span className="bg-accent text-accent-foreground shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">
                                {eventoNome}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {atendimentoAtivo ? (
                            <>
                              <span className="bg-success-bg text-success-text flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
                                <UserCog className="size-3" />
                                {atendimentoAtivo.analistaNome}
                              </span>
                              <p className="text-muted-foreground mt-1 text-xs">
                                Iniciado: {formatarDataHora(atendimentoAtivo.assumidoEm)}
                              </p>
                              <div className="mt-1.5">
                                <AtendimentoAgenciaAcoes
                                  agenciaId={agencia.id}
                                  analistaId={analistaId}
                                  atendimentoAtual={{
                                    analistaId: atendimentoAtivo.analistaId,
                                    analistaNome: atendimentoAtivo.analistaNome,
                                  }}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              {ultimoEncerrado ? (
                                <>
                                  <p className="text-foreground font-medium">
                                    {ultimoEncerrado.analistaNome}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    Finalizado: {formatarDataHora(ultimoEncerrado.liberadoEm)}
                                  </p>
                                </>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                              <form
                                action={assumirAtendimentoDossieAction.bind(null, agencia.id)}
                                className="mt-1.5"
                              >
                                <button
                                  type="submit"
                                  className="border-input text-foreground hover:bg-accent rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
                                >
                                  Iniciar atendimento
                                </button>
                              </form>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classesBadgeStatus(agencia.status)}`}
                            title={labelOrigemContrato(origemContratoAtual) ?? undefined}
                          >
                            {labelStatus(agencia.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-foreground font-medium">
                            {formatarData(agencia.createdAt)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {diasAtras(agencia.createdAt)}
                          </p>
                        </td>
                        <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                          {executivoBase ?? "—"}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                          {executivoNome ?? "—"}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                          {executivoGestor ?? "—"}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                          {associacaoNome ?? "—"}
                        </td>
                      </tr>
                    );
                  },
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
