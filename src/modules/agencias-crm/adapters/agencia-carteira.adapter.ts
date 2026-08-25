import type {
  AgenciaRosterSst,
  MetricasCarteiraSst,
} from "@/modules/agencias-crm/services/agencia-carteira.sst-service";
import type { AgenciaCarteiraView } from "@/modules/agencias-crm/types/agencia-carteira.types";

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
// só fica sem gestor/executivoId pra filtrar — `base` não depende mais
// desse match (vem direto do SST, ver `item.baseSigla` abaixo).
//
// metricasReaisPorSica: mapa do SST (agenciaCarteiraSstService.
// obterMetricasCarteira(), indexado por codigoEmpresa) ou `null` quando a
// integração está desligada (sem SST_API_KEY) ou indisponível. Mesmo com
// o mapa presente, uma agência sem venda detectada em nenhum canal não
// tem entrada nele — nesses dois casos os campos comerciais abaixo ficam
// honestamente zerados/nulos (a UI já mostra "—" pra 0, ver
// agencias-carteira-tabela.tsx), SEM mock por hash (pedido do usuário,
// 2026-08-25: a listagem mostrava um número inventado — mas plausível —
// pra toda agência sem venda real detectada, sem nenhuma indicação de
// que era fake; batia até com R$ milhões em "Vendas ano" pra agência que
// nunca vendeu nada, achado num caso real, sica 53334).
export function montarAgenciaCarteiraView(
  item: AgenciaRosterSst,
  promotorPorSica: Map<number, ExecutivoResumo>,
  regiaoPorBase: Map<string, string | null>,
  metricasReaisPorSica: Map<string, MetricasCarteiraSst> | null,
): AgenciaCarteiraView {
  const sicaCodigo = String(item.codigoEmpresa);
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
    // faixa de premiação) — sempre null, nunca mockar.
    categoria: null,
    canal: metricasReais?.canal ?? null,
    bilhetes: metricasReais?.bilhetes ?? 0,
    ticketMedio: metricasReais?.ticketMedio ?? 0,
    vendasMes: metricasReais?.vendasMes ?? 0,
    vendasAno: metricasReais?.vendasAno ?? 0,
    // null = nenhuma venda detectada em nenhum canal (nunca comprou, ou
    // fora das janelas consultadas) — diferente de "comprou hoje" (0).
    diasSemComprar: metricasReais?.diasSemComprar ?? null,
    // limite: sem fonte real no SST (o único campo espelhado do SICA é
    // limite de crédito de fatura, não limite de compra) — sempre 0,
    // nunca mockar.
    limite: 0,
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
// têm fonte aqui (sem SST não há como medir venda nenhuma) — honestamente
// zeradas/nulas, nunca mock por hash (pedido do usuário, 2026-08-25,
// mesmo critério de montarAgenciaCarteiraView).
export function montarAgenciaCarteiraViewLocal(
  item: AgenciaLocalCarteiraItem,
  promotorPorId: Map<string, ExecutivoResumo>,
  regiaoPorBase: Map<string, string | null>,
): AgenciaCarteiraView {
  const executivo = item.executivoId ? promotorPorId.get(item.executivoId) : undefined;
  const base = executivo?.bases[0] ?? null;
  const regiao = base ? (regiaoPorBase.get(base) ?? null) : null;

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
    categoria: null,
    canal: null,
    bilhetes: 0,
    ticketMedio: 0,
    vendasMes: 0,
    vendasAno: 0,
    diasSemComprar: null,
    limite: 0,
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
