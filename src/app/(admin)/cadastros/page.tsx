import Link from "next/link";
import type { ReactNode } from "react";
import {
  UserCog,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Bell,
  Clock,
  Info,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { CadastrosLive } from "./cadastros-live";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { atendimentoController } from "@/modules/atendimento/presentation/controllers/atendimento.controller";
import { maskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import { STATUS_AGENCIA_LABEL } from "@/modules/cadastro/utils/status-agencia-label.util";
import {
  labelStatus,
  classesBadgeStatus,
  STATUS_LABELS,
} from "@/modules/admin/utils/status-cadastro.util";
import { GraficoOrigemContrato } from "@/modules/admin/components/grafico-origem-contrato";
import { GraficoContratosPorDia } from "@/modules/admin/components/grafico-contratos-por-dia";
import { FiltroCadastrosField } from "@/modules/admin/components/filtro-cadastros-field";
import { SeletorTamanhoPagina } from "@/modules/admin/components/seletor-tamanho-pagina";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { OpcaoFiltroCadastros } from "@/modules/admin/types/filtro-cadastros.types";
import {
  paraArray,
  resolverFiltrosCadastros,
} from "@/modules/admin/utils/resolver-filtros-cadastros.util";
import {
  STATUS_EM_ANALISE,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_ATIVO,
  STATUS_RECUSADO,
  TAMANHO_PAGINA_CADASTROS,
  TAMANHOS_PAGINA_CADASTROS_PERMITIDOS,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

interface CadastrosPageProps {
  searchParams: {
    busca?: string;
    status?: string;
    sort?: string;
    dir?: string;
    filtro?: string | string[];
    meusAtendimentos?: string;
    infoPendente?: string;
    page?: string;
    pageSize?: string;
  };
}

// Filas clicáveis — ciclo completo de estados (decisão do usuário,
// 2026-07-16; "em_analise" adicionado em 2026-07-24 quando o envio do
// cadastro passou a persistir antes da IA rodar; unificada com o KPI
// numérico em 2026-07-27, um card só por status; "aguardando_cadastramento"
// adicionado em 2026-07-30, ver agencia-repository.ts): o cadastro é
// persistido assim que enviado ("em_analise") e a IA avalia depois, em
// background; se reprovar (ou a análise falhar tecnicamente) vai pra
// "em_complementar" (sem contrato ainda). Se aprovar (ou depois que o
// analista aprovar manualmente na fila Complementar), o contrato é
// gerado e cai em "aguardando_assinatura". Quando TODOS OS SÓCIOS
// assinam, vira "aguardando_validacao" (analista valida as evidências de
// assinatura); validado, vira "aguardando_cadastramento" (falta cadastrar
// SICA e TravelLink); cadastrado, vira "aguardando_ativacao" (só falta
// Usuário Master + clicar ativar); ativado vira "ativo", ou a qualquer
// momento pode ser "recusado".
// Cor padrão por card (decisão do usuário, 2026-07-30): roxo pra "gerado
// pela IA" (análise), teal pra etapas conduzidas pelo analista
// (complementar/validação/ativação), verde pra ativo e vermelho pra
// recusado. "Aguardando assinatura" fica sem cor própria — o card não
// muda, só ganha um hover com o breakdown IA x analista (ver Tooltip
// abaixo, cores reaproveitadas: COR_ORIGEM_IA/COR_ORIGEM_HUMANO).
const COR_ORIGEM_IA = "#8A2BE2";
const COR_ORIGEM_HUMANO = "#008B8B";
const COR_CLIENTE = "#f013b1e2";
const COR_ATIVO = "#008000";
const COR_RECUSADO = "#DC143C";

const FILAS = [
  {
    status: STATUS_EM_ANALISE,
    chave: "emAnalise" as const,
    label: STATUS_AGENCIA_LABEL[STATUS_EM_ANALISE],
    sublabel: "aguardando a IA avaliar",
    cor: COR_ORIGEM_IA,
  },
  {
    status: STATUS_EM_COMPLEMENTAR,
    chave: "emComplementar" as const,
    label: STATUS_AGENCIA_LABEL[STATUS_EM_COMPLEMENTAR],
    sublabel: "Setor Cadastro",
    cor: COR_ORIGEM_HUMANO,
  },
  {
    status: STATUS_AGUARDANDO_ASSINATURA,
    chave: "aguardandoAssinatura" as const,
    label: STATUS_AGENCIA_LABEL[STATUS_AGUARDANDO_ASSINATURA],
    sublabel: "Setor Comercial",
    cor: COR_CLIENTE,
  },
  {
    status: STATUS_AGUARDANDO_VALIDACAO,
    chave: "aguardandoValidacao" as const,
    label: STATUS_AGENCIA_LABEL[STATUS_AGUARDANDO_VALIDACAO],
    sublabel: "Setor Cadastro",
    cor: COR_ORIGEM_HUMANO,
  },
  {
    status: STATUS_AGUARDANDO_CADASTRAMENTO,
    chave: "aguardandoCadastramento" as const,
    label: STATUS_AGENCIA_LABEL[STATUS_AGUARDANDO_CADASTRAMENTO],
    sublabel: "Setor Cadastro",
    cor: COR_ORIGEM_HUMANO,
  },
  {
    status: STATUS_AGUARDANDO_ATIVACAO,
    chave: "aguardandoAtivacao" as const,
    label: STATUS_AGENCIA_LABEL[STATUS_AGUARDANDO_ATIVACAO],
    sublabel: "Suporte Comercial",
    cor: COR_ORIGEM_HUMANO,
  },
  {
    status: STATUS_ATIVO,
    chave: "ativas" as const,
    label: STATUS_AGENCIA_LABEL[STATUS_ATIVO],
    sublabel: "agência liberada e operando",
    cor: COR_ATIVO,
  },
  {
    status: STATUS_RECUSADO,
    chave: "recusadas" as const,
    label: STATUS_AGENCIA_LABEL[STATUS_RECUSADO],
    sublabel: "cadastro recusado",
    cor: COR_RECUSADO,
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
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

function construirHref(
  searchParams: CadastrosPageProps["searchParams"],
  patch: Record<string, string | undefined>,
  basePath = "/cadastros",
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
  return query ? `${basePath}?${query}` : basePath;
}

// Janela de páginas numeradas no rodapé da tabela (« ‹ 1 2 3 4 5 › »),
// centrada na página atual — não usa "..." pros extremos, a lista é curta
// o bastante pra não precisar.
function calcularPaginasVisiveis(paginaAtual: number, totalPaginas: number): number[] {
  const JANELA = 5;
  if (totalPaginas <= JANELA) {
    return Array.from({ length: totalPaginas }, (_, indice) => indice + 1);
  }
  const fim = Math.min(totalPaginas, Math.max(JANELA, paginaAtual + Math.floor(JANELA / 2)));
  const inicio = fim - JANELA + 1;
  return Array.from({ length: JANELA }, (_, indice) => inicio + indice);
}

function BotaoPaginacao({
  href,
  desabilitado,
  ariaLabel,
  children,
}: {
  href: string;
  desabilitado: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  if (desabilitado) {
    return (
      <span
        aria-label={ariaLabel}
        className="border-input text-muted-foreground flex size-7 shrink-0 cursor-not-allowed items-center justify-center rounded-full border opacity-40"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="border-input text-foreground hover:bg-accent flex size-7 shrink-0 items-center justify-center rounded-full border transition"
    >
      {children}
    </Link>
  );
}

function BotaoPagina({ pagina, ativa, href }: { pagina: number; ativa: boolean; href: string }) {
  if (ativa) {
    return (
      <span
        aria-current="page"
        className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      >
        {pagina}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="border-input text-foreground hover:bg-accent flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition"
    >
      {pagina}
    </Link>
  );
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
        href={construirHref(searchParams, { sort: coluna.chave, dir: proximaDir, page: undefined })}
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
  const cargo = session?.user?.cargo;

  // Gestor/Executivo (2026-08-03) só acompanham (leitura) o que é deles —
  // resolvido aqui e forçado abaixo no filtro real, ignorando qualquer
  // executivoId/gestorId que viesse da querystring. Sentinela
  // "__sem_vinculo__" quando o cargo é restrito mas não achou o
  // Promotor/Gestor vinculado (não deve acontecer em uso normal) — nunca
  // cai pra "sem filtro" = mostrar tudo.
  const paginaAtual = Math.max(1, Math.trunc(Number(searchParams.page)) || 1);
  const tamanhoPaginaSolicitado = Number(searchParams.pageSize);
  const tamanhoPagina = (TAMANHOS_PAGINA_CADASTROS_PERMITIDOS as readonly number[]).includes(
    tamanhoPaginaSolicitado,
  )
    ? tamanhoPaginaSolicitado
    : TAMANHO_PAGINA_CADASTROS;

  const { filtros, escopoRestrito, sortBy, sortDir } = await resolverFiltrosCadastros(
    searchParams,
    { analistaId, cargo },
  );
  const valoresFiltro = paraArray(searchParams.filtro);

  const [{ items, total, kpis }, analise, promotores, associacoesTodas, gestoresReais] =
    await Promise.all([
      cadastroAdminController.listarCadastros({ ...filtros, pagina: paginaAtual, tamanhoPagina }),
      ANALISE_HABILITADA ? cadastroAdminController.obterAnaliseContratos(14) : null,
      atribuicoesAdminController.listarPromotores(),
      atribuicoesAdminController.listarAssociacoes(),
      atribuicoesAdminController.listarGestores(),
    ]);
  const totalPaginas = Math.max(1, Math.ceil(total / tamanhoPagina));

  const associacoesAtivas = associacoesTodas.filter((associacao) => associacao.ativo);

  // Opções do filtro único, agrupadas por categoria na ordem em que devem
  // aparecer no dropdown — Base derivada em memória (não existe query
  // dedicada, lista é pequena) a partir dos mesmos promotores já buscados
  // acima; Gestor vem do model real (Gestor.id, não mais nome/string).
  // Gestor/Executivo (escopoRestrito) só filtram por Status — Base/Gestor/
  // Executivo/Associação são pra ampliar o recorte, e o deles já está
  // travado acima, então mostrar essas opções só confundiria.
  const basesUnicas = [...new Set(promotores.flatMap((p) => p.bases))];
  const opcoesFiltro: OpcaoFiltroCadastros[] = escopoRestrito
    ? Object.entries(STATUS_LABELS).map(([status, label]) => ({
        value: `status:${status}`,
        label,
        categoria: "Status",
      }))
    : [
        ...basesUnicas.map((base) => ({ value: `base:${base}`, label: base, categoria: "Base" })),
        ...gestoresReais.map((gestor) => ({
          value: `gestor:${gestor.id}`,
          label: gestor.nome,
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
        {escopoRestrito ? null : (
          <label className="flex shrink-0 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="meusAtendimentos"
              value="1"
              defaultChecked={searchParams.meusAtendimentos === "1"}
              className="peer sr-only"
            />
            <span className="peer-checked:bg-primary bg-input relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition before:absolute before:left-0.5 before:size-5 before:rounded-full before:bg-white before:shadow before:transition-transform before:content-[''] peer-checked:before:translate-x-5" />
            <span className="text-foreground font-medium whitespace-nowrap">Meus atendimentos</span>
          </label>
        )}
        <select
          name="infoPendente"
          defaultValue={searchParams.infoPendente ?? ""}
          className="border-input bg-card text-foreground focus:border-primary focus:ring-ring/30 shrink-0 rounded-full border px-3 py-2 text-sm outline-none focus:ring-2"
        >
          <option value="">Info pendente: todos</option>
          <option value="1">Info pendente: com</option>
          <option value="0">Info pendente: sem</option>
        </select>
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
          largas o flex-1 distribui o espaço sobrando igualmente.
          Escondido pra Gestor/Executivo (escopoRestrito): kpis vem de
          obterKpis(), que é global (não filtrado por executivo/gestor) —
          mostraria número da empresa inteira, não só do escopo deles. */}
      {escopoRestrito ? null : (
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
              return (
                <Link
                  key={fila.status}
                  href={construirHref(searchParams, {
                    status: ativa ? undefined : fila.status,
                    page: undefined,
                  })}
                  className={cardClassName}
                >
                  {cardConteudo}
                </Link>
              );
            }

            // Breakdown por Agencia.infoPendente (ver
            // CadastrosKpis.emComplementarPorInfoPendente): "em aberto"
            // (aguardando o time analisar) x "info pendente" (aguardando
            // retorno da agência) — mesmo tratamento do card equivalente no
            // /dashboard.
            if (fila.status === STATUS_EM_COMPLEMENTAR) {
              const { emAberto, infoPendente } = kpis.emComplementarPorInfoPendente;
              return (
                <Link
                  key={fila.status}
                  href={construirHref(searchParams, {
                    status: ativa ? undefined : fila.status,
                    page: undefined,
                  })}
                  className={cardClassName}
                  style={cardStyle}
                >
                  <span className="text-muted-foreground line-clamp-2 flex min-h-[2rem] items-start gap-1 text-xs font-medium tracking-wide">
                    {fila.label}
                    <Tooltip>
                      {/* render=<span> (não <button>, default do TooltipTrigger) —
                          este card inteiro já é um <Link>, e HTML não permite
                          elemento interativo aninhado dentro de outro. */}
                      <TooltipTrigger render={<span className="mt-0.5 inline-flex shrink-0" />}>
                        <Info className="size-3" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          <p>
                            <strong>{emAberto}</strong> em aberto — aguardando análise do time
                          </p>
                          <p>
                            <strong>{infoPendente}</strong> com informação pendente — aguardando
                            retorno da agência (reenvio de documento solicitado)
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <p className="mt-1 text-3xl font-bold" style={{ color: fila.cor }}>
                    {emAberto} | {infoPendente}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">{fila.sublabel}</p>
                </Link>
              );
            }

            return (
              <Link
                key={fila.status}
                href={construirHref(searchParams, {
                  status: ativa ? undefined : fila.status,
                  page: undefined,
                })}
                className={cardClassName}
                style={cardStyle}
              >
                {cardConteudo}
              </Link>
            );
          })}
        </div>
      )}

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
                    SICA
                  </th>
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
                    consultaSicaMaisRecente,
                    temAtualizacaoPendente,
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
                            <div className="flex shrink-0 items-center gap-1.5">
                              {agencia.infoPendente ? (
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap">
                                        <Clock className="size-3" />
                                        Info pendente
                                      </span>
                                    }
                                  />
                                  <TooltipContent>
                                    Aguardando algo da agência (reenvio de documento pedido)
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                              {temAtualizacaoPendente ? (
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <span className="bg-warning/15 text-warning inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap">
                                        <Bell className="size-3" />
                                        Atualização
                                      </span>
                                    }
                                  />
                                  <TooltipContent>
                                    Nova mensagem ou documento desde a última visita
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                              {eventoNome ? (
                                <span className="bg-accent text-accent-foreground rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">
                                  {eventoNome}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {consultaSicaMaisRecente?.encontrado ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <span
                                    className={`cursor-default rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                                      consultaSicaMaisRecente.empresaStatus === "ativo"
                                        ? "bg-success/15 text-success"
                                        : "bg-warning/15 text-warning"
                                    }`}
                                  >
                                    {consultaSicaMaisRecente.codigoEmpresa ?? "—"}
                                  </span>
                                }
                              />
                              <TooltipContent className="flex flex-col gap-0.5">
                                <span>
                                  {consultaSicaMaisRecente.nomeEmpresa ?? "—"}
                                  {consultaSicaMaisRecente.codigoEmpresa
                                    ? ` (#${consultaSicaMaisRecente.codigoEmpresa})`
                                    : ""}
                                </span>
                                <span>Tel: {consultaSicaMaisRecente.telefone ?? "—"}</span>
                                <span>E-mail: {consultaSicaMaisRecente.email ?? "—"}</span>
                                <span>
                                  Executivo: {consultaSicaMaisRecente.nomeExecutivo ?? "—"}
                                  {consultaSicaMaisRecente.codigoExecutivo
                                    ? ` (#${consultaSicaMaisRecente.codigoExecutivo})`
                                    : ""}
                                </span>
                                <span>
                                  Consultado em {formatarData(consultaSicaMaisRecente.createdAt)}
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
                            </>
                          ) : ultimoEncerrado ? (
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

        {/* Rodapé — mesma bg-card do corpo da tabela (extensão dela, sem
            contraste como no header) e mesmo padding horizontal do
            thead/tbody, só com border-t em vez de border-b. */}
        <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-muted-foreground text-xs">{total} agência(s) encontrada(s)</p>
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-muted-foreground text-xs whitespace-nowrap">
                Itens por página
              </label>
              <SeletorTamanhoPagina
                id="pageSize"
                valor={tamanhoPagina}
                opcoes={TAMANHOS_PAGINA_CADASTROS_PERMITIDOS}
                hrefPorTamanho={Object.fromEntries(
                  TAMANHOS_PAGINA_CADASTROS_PERMITIDOS.map((tamanho) => [
                    String(tamanho),
                    construirHref(searchParams, { pageSize: String(tamanho), page: "1" }),
                  ]),
                )}
              />
            </div>
            <a
              href={construirHref(
                searchParams,
                { page: undefined, pageSize: undefined },
                "/cadastros/exportar",
              )}
              className="border-input text-foreground hover:bg-accent rounded-full border px-3 py-1.5 text-xs font-semibold transition"
            >
              Exportar CSV
            </a>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground mr-1 text-xs whitespace-nowrap">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <BotaoPaginacao
              href={construirHref(searchParams, { page: "1" })}
              desabilitado={paginaAtual === 1}
              ariaLabel="Primeira página"
            >
              <ChevronsLeft className="size-4" />
            </BotaoPaginacao>
            <BotaoPaginacao
              href={construirHref(searchParams, { page: String(paginaAtual - 1) })}
              desabilitado={paginaAtual === 1}
              ariaLabel="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </BotaoPaginacao>
            {calcularPaginasVisiveis(paginaAtual, totalPaginas).map((pagina) => (
              <BotaoPagina
                key={pagina}
                pagina={pagina}
                ativa={pagina === paginaAtual}
                href={construirHref(searchParams, { page: String(pagina) })}
              />
            ))}
            <BotaoPaginacao
              href={construirHref(searchParams, { page: String(paginaAtual + 1) })}
              desabilitado={paginaAtual === totalPaginas}
              ariaLabel="Próxima página"
            >
              <ChevronRight className="size-4" />
            </BotaoPaginacao>
            <BotaoPaginacao
              href={construirHref(searchParams, { page: String(totalPaginas) })}
              desabilitado={paginaAtual === totalPaginas}
              ariaLabel="Última página"
            >
              <ChevronsRight className="size-4" />
            </BotaoPaginacao>
          </div>
        </div>
      </div>
    </div>
  );
}
