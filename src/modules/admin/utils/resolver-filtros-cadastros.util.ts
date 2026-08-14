import type { Cargo } from "@/modules/users/domain/enums";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import type { ListarCadastrosFiltros } from "@/modules/cadastro/domain/repositories/agencia-repository";

export interface CadastrosSearchParams {
  busca?: string;
  status?: string | string[];
  sort?: string;
  dir?: string;
  filtro?: string | string[];
  meusAtendimentos?: string;
}

export function paraArray(valor: string | string[] | undefined): string[] {
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

export interface FiltrosCadastrosResolvidos {
  filtros: Omit<ListarCadastrosFiltros, "pagina" | "tamanhoPagina" | "todos">;
  escopoRestrito: boolean;
  sortBy: "razaoSocial" | "createdAt";
  sortDir: "asc" | "desc";
}

// Resolve os filtros efetivos da listagem de /cadastros a partir da
// querystring + sessão — usado tanto pela página (tabela paginada, ver
// page.tsx) quanto pela exportação (CSV sem paginação, ver
// exportar/route.ts), pra garantir que as duas fontes nunca filtrem de
// formas diferentes.
export async function resolverFiltrosCadastros(
  searchParams: CadastrosSearchParams,
  sessao: { analistaId: string; cargo?: Cargo },
): Promise<FiltrosCadastrosResolvidos> {
  const { analistaId, cargo } = sessao;

  // Gestor/Executivo (2026-08-03) só acompanham (leitura) o que é deles —
  // resolvido aqui e forçado abaixo no filtro real, ignorando qualquer
  // executivoId/gestorId que viesse da querystring. Sentinela
  // "__sem_vinculo__" quando o cargo é restrito mas não achou o
  // Promotor/Gestor vinculado (não deve acontecer em uso normal) — nunca
  // cai pra "sem filtro" = mostrar tudo.
  const promotorDoUsuario =
    cargo === "EXECUTIVO" && analistaId
      ? await atribuicoesAdminController.buscarPromotorPorUserId(analistaId)
      : null;
  const gestorDoUsuario =
    cargo === "GESTOR" && analistaId
      ? await atribuicoesAdminController.buscarGestorPorUserId(analistaId)
      : null;
  const escopoRestrito = cargo === "GESTOR" || cargo === "EXECUTIVO";
  const executivoIdForcado =
    cargo === "EXECUTIVO" ? (promotorDoUsuario?.id ?? "__sem_vinculo__") : null;
  const gestorIdForcado = cargo === "GESTOR" ? (gestorDoUsuario?.id ?? "__sem_vinculo__") : null;

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
  // Switch "Meus atendimentos" (decisão do usuário, 2026-07-30): filtra
  // no banco pelas agências onde o analista logado é o atendente ATIVO —
  // sem sessão não há o que filtrar, então o switch é ignorado.
  const meusAtendimentosAtivo = searchParams.meusAtendimentos === "1" && !!analistaId;

  return {
    filtros: {
      busca: searchParams.busca,
      status: statusCombinado.length > 0 ? statusCombinado : undefined,
      sortBy,
      sortDir,
      executivoId: executivoIdForcado ?? executivoDoFiltro,
      associacaoId: associacaoDoFiltro,
      base: baseDoFiltro,
      gestorId: gestorIdForcado ?? gestorDoFiltro,
      atendenteAtivoId: meusAtendimentosAtivo ? analistaId : undefined,
    },
    escopoRestrito,
    sortBy,
    sortDir,
  };
}
