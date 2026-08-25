import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type {
  AgenciaRosterSst,
  MetricasCarteiraSst,
} from "@/modules/agencias-crm/services/agencia-carteira.sst-service";
import type {
  AgenciaCarteiraView,
  CanalVendas,
  CategoriaPremiacao,
} from "@/modules/agencias-crm/types/agencia-carteira.types";

const CATEGORIAS: CategoriaPremiacao[] = ["10K", "100K", "1M", "10M"];
const CANAIS: CanalVendas[] = ["aereo", "terrestre", "ambos"];

export interface ExecutivoResumo {
  id: string;
  nome: string;
  bases: string[];
  gestorNome: string | null;
}

interface MetricasMock {
  categoria: CategoriaPremiacao | null;
  canal: CanalVendas;
  bilhetes: number;
  ticketMedio: number;
  vendasMes: number;
  vendasAno: number;
  diasSemComprar: number;
  limite: number;
}

// Extraído de montarAgenciaCarteiraView (era código inline ali) pra ser
// reaproveitado também por montarAgenciaCarteiraViewLocal — nenhuma das
// duas fontes (SST sem venda detectada, ou agência local sem fonte
// comercial nenhuma) tem esses números de verdade, então ambas caem no
// mesmo mock determinístico por hash.
function gerarMetricasMock(seed: number): MetricasMock {
  const semVenda = seed % 10 === 0;
  const bilhetes = semVenda ? 0 : 5 + (seed % 400);
  const vendasAno = semVenda ? 0 : ((seed % 900) + 20) * 10_000;
  const vendasMes = semVenda ? 0 : Math.round(vendasAno * (0.05 + ((seed >> 2) % 10) / 100));
  const ticketMedio = bilhetes > 0 ? Math.round(vendasAno / bilhetes) : 0;
  const diasSemComprar = semVenda ? 90 + (seed % 300) : seed % 400;
  // limite: sem fonte real no SST (o único campo espelhado do SICA é
  // limite de crédito de fatura, não limite de compra — mesmo achado
  // documentado abaixo) — mock sempre, calculado sobre o vendasAno já
  // resolvido.
  const limite = Math.round(vendasAno * (1.1 + ((seed >> 4) % 30) / 100));

  return {
    categoria: semVenda ? null : CATEGORIAS[seed % CATEGORIAS.length]!,
    canal: CANAIS[(seed >> 3) % CANAIS.length]!,
    bilhetes,
    ticketMedio,
    vendasMes,
    vendasAno,
    diasSemComprar,
    limite,
  };
}

// regiaoPorBase: sigla da Base -> região (derivada de Base.uf, real — ver
// regiao-por-uf.util.ts), resolvida uma vez pelo loader e repassada aqui.
//
// promotorPorSica: Promotor.sica -> resumo do executivo, único jeito de
// ligar o `codigoExecutivo` do SST à hierarquia local Executivo→Gestor
// (que não existe no SST). Agência cujo executivo não tem Promotor local
// correspondente ainda mostra o nome vindo do SST (item.nomeExecutivo),
// só fica sem gestor/executivoId pra filtrar — `base` não depende mais
// desse match (vem direto do SST, ver `item.baseSigla` abaixo).
//
// metricasReaisPorSica: mapa do SST (agenciaCarteiraSstService.
// obterMetricasCarteira(), indexado por codigoEmpresa) ou `null` quando a
// integração está desligada (sem SST_API_KEY) ou indisponível — nesse
// caso TUDO cai no mock por hash. Mesmo com o mapa presente, uma agência
// sem venda detectada em nenhum canal também cai no mock — é o fallback
// natural, não um caso de erro.
export function montarAgenciaCarteiraView(
  item: AgenciaRosterSst,
  promotorPorSica: Map<number, ExecutivoResumo>,
  regiaoPorBase: Map<string, string | null>,
  metricasReaisPorSica: Map<string, MetricasCarteiraSst> | null,
): AgenciaCarteiraView {
  const sicaCodigo = String(item.codigoEmpresa);
  const seed = hashParaNumero(sicaCodigo);
  const reprovadaOuInativa = item.status !== "ativo";

  const executivo =
    item.codigoExecutivo !== null ? promotorPorSica.get(item.codigoExecutivo) : undefined;
  // `base`: real do SST (sigla de 3 letras, ex. "SAO"/"RAO"/"VIX", direto
  // de /api/agencias/ativas) — pedido do usuário, 2026-08-25: substitui o
  // "melhor esforço" via Promotor.bases[0] (local, esparso, só cobria as
  // ~11 pessoas atribuídas manualmente). Cai pro local só se o SST não
  // trouxer base pra essa linha.
  const base = item.baseSigla ?? executivo?.bases[0] ?? null;
  const regiao = base ? (regiaoPorBase.get(base) ?? null) : null;

  const metricasReais = metricasReaisPorSica?.get(sicaCodigo);
  const mock = gerarMetricasMock(seed);

  // real (SST, resumo-agrupado) quando `metricasReais` existe — ver
  // agencia-carteira.sst-service.ts; mock determinístico por hash como
  // fallback (agência sem venda detectada no SST, ou integração
  // desligada).
  const bilhetes = metricasReais?.bilhetes ?? mock.bilhetes;
  const vendasAno = metricasReais?.vendasAno ?? mock.vendasAno;
  const vendasMes = metricasReais?.vendasMes ?? mock.vendasMes;
  const ticketMedio = metricasReais?.ticketMedio ?? mock.ticketMedio;
  const diasSemComprar = metricasReais?.diasSemComprar ?? mock.diasSemComprar;
  const canal = metricasReais?.canal ?? mock.canal;

  // limite: sem fonte real no SST (o único campo espelhado do SICA é
  // limite de crédito de fatura, não limite de compra — mesmo achado
  // documentado em executivo-dashboard.sst-service.ts) — mock sempre,
  // calculado sobre o vendasAno já resolvido (real ou mock). Recalculado
  // aqui (não usa mock.limite direto) porque `mock` foi gerado a partir
  // de vendasAnoMock, mas o limite deve refletir o vendasAno final (real
  // ou mock) — mesma fórmula, base diferente.
  const limite = Math.round(vendasAno * (1.1 + ((seed >> 4) % 30) / 100));

  return {
    id: sicaCodigo,
    razaoSocial: item.nome,
    cnpj: item.cnpj,
    status: item.status,
    // Sem fonte real hoje — o funil de onboarding deste app (que tinha
    // esse conceito) não é mais a origem da listagem.
    dadosFaltantes: false,
    reprovadaOuInativa,
    executivoId: executivo?.id ?? null,
    executivoNome: executivo?.nome ?? item.nomeExecutivo,
    gestorNome: executivo?.gestorNome ?? null,
    base,
    regiao,
    // categoria/premiação: sem fonte real no SST (não existe endpoint de
    // faixa de premiação) — critério de negócio ainda não confirmado
    // pra derivar de vendasAno real, mock por hash até essa regra existir.
    categoria: mock.categoria,
    canal,
    bilhetes,
    ticketMedio,
    vendasMes,
    vendasAno,
    diasSemComprar,
    limite,
    // sicaCodigo (variável local) já é String(item.codigoEmpresa) — mesmo
    // identificador que o SICA usa como codigo_empresa/codigo_cliente,
    // não um campo separado em AgenciaRosterSst.
    sica: sicaCodigo,
  };
}

export function montarAgenciasCarteiraViewList(
  itens: AgenciaRosterSst[],
  promotorPorSica: Map<number, ExecutivoResumo>,
  regiaoPorBase: Map<string, string | null>,
  metricasReaisPorSica: Map<string, MetricasCarteiraSst> | null,
): AgenciaCarteiraView[] {
  return itens.map((item) =>
    montarAgenciaCarteiraView(item, promotorPorSica, regiaoPorBase, metricasReaisPorSica),
  );
}

// Formato mínimo que o loader extrai de ListarCadastrosItem (cadastro
// module) — mantém este adapter sem depender do tipo `Agencia`/Prisma
// nem de `ListarCadastrosItem` inteiro, só do que ele realmente usa.
export interface AgenciaLocalCarteiraItem {
  id: string;
  razaoSocial: string;
  cnpj: string;
  status: string;
  executivoId: string | null;
  executivoNome: string | null;
  gestorNome: string | null;
}

// Fallback local (sem SST_API_KEY configurada, ambiente de dev) — traduz
// uma agência real do funil de cadastro/onboarding deste app (tabela
// `Agencia` via Prisma, não o roster do SST) pro mesmo formato de view
// que a tabela já sabe renderizar. `id` fica como o cuid local (não um
// código SICA numérico), então o link de detalhe cai naturalmente no
// dossiê local (/crm/agencias/[id] distingue os dois pelo formato do id —
// ver REGEX_CODIGO_SICA). Métricas comerciais (vendas/bilhetes/etc) não
// têm fonte aqui — sempre mock por hash, mesmo critério de
// montarAgenciaCarteiraView quando a agência não tem venda detectada.
export function montarAgenciaCarteiraViewLocal(
  item: AgenciaLocalCarteiraItem,
  promotorPorId: Map<string, ExecutivoResumo>,
  regiaoPorBase: Map<string, string | null>,
): AgenciaCarteiraView {
  const seed = hashParaNumero(item.id);
  const executivo = item.executivoId ? promotorPorId.get(item.executivoId) : undefined;
  const base = executivo?.bases[0] ?? null;
  const regiao = base ? (regiaoPorBase.get(base) ?? null) : null;
  const mock = gerarMetricasMock(seed);

  return {
    id: item.id,
    razaoSocial: item.razaoSocial,
    cnpj: item.cnpj,
    status: item.status,
    dadosFaltantes: false,
    reprovadaOuInativa: item.status !== "ativo",
    executivoId: item.executivoId,
    executivoNome: item.executivoNome ?? executivo?.nome ?? null,
    gestorNome: item.gestorNome ?? executivo?.gestorNome ?? null,
    base,
    regiao,
    categoria: mock.categoria,
    canal: mock.canal,
    bilhetes: mock.bilhetes,
    ticketMedio: mock.ticketMedio,
    vendasMes: mock.vendasMes,
    vendasAno: mock.vendasAno,
    diasSemComprar: mock.diasSemComprar,
    limite: mock.limite,
    // Ainda não passou pelo comercial (SICA) — sem código real aqui,
    // diferente da fonte SST onde `sica` é sempre populado.
    sica: null,
  };
}

export function montarAgenciasCarteiraViewListLocal(
  itens: AgenciaLocalCarteiraItem[],
  promotorPorId: Map<string, ExecutivoResumo>,
  regiaoPorBase: Map<string, string | null>,
): AgenciaCarteiraView[] {
  return itens.map((item) => montarAgenciaCarteiraViewLocal(item, promotorPorId, regiaoPorBase));
}
