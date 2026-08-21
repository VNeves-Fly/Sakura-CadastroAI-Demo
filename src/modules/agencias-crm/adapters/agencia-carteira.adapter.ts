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

// regiaoPorBase: sigla da Base -> região (derivada de Base.uf, real — ver
// regiao-por-uf.util.ts), resolvida uma vez pelo loader e repassada aqui.
//
// promotorPorSica: Promotor.sica -> resumo do executivo, único jeito de
// ligar o `codigoExecutivo` do SST à hierarquia local Executivo→Gestor
// (que não existe no SST). Agência cujo executivo não tem Promotor local
// correspondente ainda mostra o nome vindo do SST (item.nomeExecutivo),
// só fica sem gestor/base/executivoId pra filtrar.
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
  const base = executivo?.bases[0] ?? null;
  const regiao = base ? (regiaoPorBase.get(base) ?? null) : null;

  const metricasReais = metricasReaisPorSica?.get(sicaCodigo);

  const semVenda = seed % 10 === 0;
  const bilhetesMock = semVenda ? 0 : 5 + (seed % 400);
  const vendasAnoMock = semVenda ? 0 : ((seed % 900) + 20) * 10_000;
  const vendasMesMock = semVenda
    ? 0
    : Math.round(vendasAnoMock * (0.05 + ((seed >> 2) % 10) / 100));
  const ticketMedioMock = bilhetesMock > 0 ? Math.round(vendasAnoMock / bilhetesMock) : 0;
  const diasSemComprarMock = semVenda ? 90 + (seed % 300) : seed % 400;

  // real (SST, resumo-agrupado) quando `metricasReais` existe — ver
  // agencia-carteira.sst-service.ts; mock determinístico por hash como
  // fallback (agência sem venda detectada no SST, ou integração
  // desligada).
  const bilhetes = metricasReais?.bilhetes ?? bilhetesMock;
  const vendasAno = metricasReais?.vendasAno ?? vendasAnoMock;
  const vendasMes = metricasReais?.vendasMes ?? vendasMesMock;
  const ticketMedio = metricasReais?.ticketMedio ?? ticketMedioMock;
  const diasSemComprar = metricasReais?.diasSemComprar ?? diasSemComprarMock;
  const canal = metricasReais?.canal ?? CANAIS[(seed >> 3) % CANAIS.length]!;

  // limite: sem fonte real no SST (o único campo espelhado do SICA é
  // limite de crédito de fatura, não limite de compra — mesmo achado
  // documentado em executivo-dashboard.sst-service.ts) — mock sempre,
  // calculado sobre o vendasAno já resolvido (real ou mock).
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
    categoria: semVenda ? null : CATEGORIAS[seed % CATEGORIAS.length]!,
    canal,
    bilhetes,
    ticketMedio,
    vendasMes,
    vendasAno,
    diasSemComprar,
    limite,
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
