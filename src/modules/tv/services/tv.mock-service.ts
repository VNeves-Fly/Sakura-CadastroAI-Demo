import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import type {
  CanalTv,
  CompanhiaShareTv,
  PeriodoTv,
  Top10LinhaTv,
  TvData,
} from "@/modules/tv/types/tv.types";

// Fonte 100% mock da página /crm/tv (Fast View) — este é um repositório
// de DEMONSTRAÇÃO: toda página de /crm/ mostra dado fictício rico e
// coerente, nunca "0/vazio honesto" e nunca chama o SST de verdade
// (decisão do projeto — ver instruções do módulo). Determinístico via
// `hashParaNumero` (sem `Math.random()`): mesmo período sempre produz o
// mesmo número, em qualquer render/navegação/poll, evitando "piscar" de
// valor a cada requisição do polling client-side (ver tv-view.tsx).

const PERIODOS: PeriodoTv[] = ["hoje", "ontem", "mes", "ano"];

// Multiplicador de magnitude por período — "hoje"/"ontem" são uma fatia
// pequena do dia, "mes" acumula ~3 semanas corridas, "ano" acumula ~8
// meses corridos (mesmo espírito do dashboard-vendas.mock-service.ts:
// cada bucket maior contém o menor, sem precisar somar de verdade).
const ESCALA_POR_PERIODO: Record<PeriodoTv, number> = {
  hoje: 1,
  ontem: 1.15,
  mes: 21,
  ano: 168,
};

// Pequena variação determinística (±) por chave, pra nenhum número bater
// redondo demais — mesmo truque usado nos outros *.mock-service.ts do
// projeto (hash vira "ruído" estável, não aleatoriedade de verdade).
function ruido(chave: string, amplitude: number): number {
  const fatia = hashParaNumero(chave) % 1000;
  return 1 + ((fatia / 999) * 2 - 1) * amplitude;
}

function valorBase(chave: string, periodo: PeriodoTv, base: number): number {
  return base * ESCALA_POR_PERIODO[periodo] * ruido(`${chave}:${periodo}`, 0.08);
}

// ─────────────────────────────────────────────────────────────────────
// vendas / aereo / terrestre
// ─────────────────────────────────────────────────────────────────────

function construirCanal(canalChave: string, periodo: PeriodoTv, baseValor: number): CanalTv {
  const valorTotal = valorBase(canalChave, periodo, baseValor);
  const ticketMedio =
    valorBase(`${canalChave}:ticket`, periodo, 1_180) / ESCALA_POR_PERIODO[periodo];
  const bilhetes = Math.round(valorTotal / ticketMedio);
  const agencias = Math.max(
    12,
    Math.round(
      valorBase(`${canalChave}:agencias`, periodo, 45) / Math.sqrt(ESCALA_POR_PERIODO[periodo]),
    ),
  );
  const nacPct = 68 + ruido(`${canalChave}:nac:${periodo}`, 0.12) * 10 - 10;
  const nacPctClamp = Math.min(92, Math.max(55, nacPct));
  return {
    valorTotal,
    bilhetes,
    agencias,
    ticketMedio,
    nacPct: nacPctClamp,
    intlPct: 100 - nacPctClamp,
  };
}

function construirVendasECanais(): Pick<TvData, "vendas" | "aereo" | "terrestre"> {
  const aereo = {} as Record<PeriodoTv, CanalTv>;
  const terrestre = {} as Record<PeriodoTv, CanalTv>;
  for (const periodo of PERIODOS) {
    aereo[periodo] = construirCanal("aereo", periodo, 214_000);
    terrestre[periodo] = construirCanal("terrestre", periodo, 38_500);
  }

  // "vendas" é só hoje/mes/ano (sem "ontem" — mesma forma de TvData) e é
  // o total aéreo+terrestre do mesmo período, com margem própria.
  const vendasHoje = aereo.hoje.valorTotal + terrestre.hoje.valorTotal;
  const vendasMes = aereo.mes.valorTotal + terrestre.mes.valorTotal;
  const vendasAno = aereo.ano.valorTotal + terrestre.ano.valorTotal;

  return {
    vendas: {
      hoje: { valorTotal: vendasHoje, margemPct: 9 + ruido("margem:hoje", 0.2) * 3 },
      mes: { valorTotal: vendasMes, margemPct: 10 + ruido("margem:mes", 0.15) * 3 },
      ano: { valorTotal: vendasAno, margemPct: 10.5 + ruido("margem:ano", 0.1) * 2 },
    },
    aereo,
    terrestre,
  };
}

// ─────────────────────────────────────────────────────────────────────
// shareAereo — mesmas 3 companhias nacionais + "Outras", coerente com o
// resto do CRM mock (mesmos nomes usados em dashboard-vendas.mock-service.ts).
// ─────────────────────────────────────────────────────────────────────

const COMPANHIAS_NACIONAIS = [
  { nome: "Azul", corHex: "#00A1E0", pesoBase: 34 },
  { nome: "Gol", corHex: "#FF6600", pesoBase: 30 },
  { nome: "Latam", corHex: "#E91E8C", pesoBase: 28 },
  { nome: "Outras", corHex: "#fbcfe8", pesoBase: 8 },
] as const;

function construirShareAereoDoPeriodo(periodo: PeriodoTv): CompanhiaShareTv[] {
  const pesos = COMPANHIAS_NACIONAIS.map(
    (companhia) => companhia.pesoBase * ruido(`share:${companhia.nome}:${periodo}`, 0.15),
  );
  const somaPesos = pesos.reduce((soma, peso) => soma + peso, 0);
  const valorTotalNacional = valorBase("share:total", periodo, 168_000);

  return COMPANHIAS_NACIONAIS.map((companhia, indice) => {
    const pct = (pesos[indice]! / somaPesos) * 100;
    return {
      nome: companhia.nome,
      corHex: companhia.corHex,
      pct,
      valorAbsoluto: (pct / 100) * valorTotalNacional,
    };
  });
}

function construirShareAereo(): Record<PeriodoTv, CompanhiaShareTv[]> {
  return Object.fromEntries(
    PERIODOS.map((periodo): [PeriodoTv, CompanhiaShareTv[]] => [
      periodo,
      construirShareAereoDoPeriodo(periodo),
    ]),
  ) as Record<PeriodoTv, CompanhiaShareTv[]>;
}

// ─────────────────────────────────────────────────────────────────────
// top10Clientes / top10Nacional / top10Internacional — reaproveita nomes
// fictícios de agência já usados em crm-mock/agencias.mock-data.ts, pra
// ficar coerente com o resto do CRM demo (mesmas "empresas" aparecendo
// em Agências e no ranking da TV).
// ─────────────────────────────────────────────────────────────────────

const NOMES_AGENCIAS_TOP = [
  "Horizonte Sul Viagens",
  "Estrela Norte Turismo",
  "Caminho das Águas Turismo",
  "Vale Verde Viagens",
  "Porto Seguro Turismo Ltda",
  "Nova Aurora Viagens",
  "Trilha Real Turismo",
  "Costa Dourada Viagens",
  "Rota Azul Turismo",
  "Terra Firme Viagens",
];

const NOMES_AGENCIAS_NACIONAL = [
  "Bela Vista Turismo",
  "Ponte Alta Viagens",
  "Serra Azul Turismo",
  "Mar Aberto Viagens",
  "Campo Largo Turismo",
  "Rio Claro Viagens",
  "Monte Verde Turismo",
  "Praia Bonita Viagens",
  "Vento Sul Turismo",
  "Lagoa Dourada Viagens",
];

const NOMES_AGENCIAS_INTERNACIONAL = [
  "Fronteira Nova Turismo",
  "Céu Aberto Viagens",
  "Ponta Negra Turismo",
  "Águas Claras Viagens",
  "Horizonte Sul Viagens",
  "Nova Aurora Viagens",
  "Rota Azul Turismo",
  "Vale Verde Viagens",
  "Trilha Real Turismo",
  "Estrela Norte Turismo",
];

// Curva de peso por posição (mesmo formato 1/(posição^p) do
// dashboard-vendas.mock-service.ts) — garante ranking desc plausível sem
// sortear nada.
function construirTop10DoPeriodo(
  nomes: readonly string[],
  chave: string,
  periodo: PeriodoTv,
  valorTotalBase: number,
): Top10LinhaTv[] {
  const pesos = nomes.map((_, indice) => 1 / (indice + 1) ** 0.72);
  const somaPesos = pesos.reduce((soma, peso) => soma + peso, 0);
  const valorTotal = valorBase(`${chave}:total`, periodo, valorTotalBase);

  return nomes.map((nome, indice) => {
    const valor =
      (pesos[indice]! / somaPesos) * valorTotal * ruido(`${chave}:${nome}:${periodo}`, 0.1);
    return {
      posicao: indice + 1,
      nome,
      valor,
      margemPct: 8 + ruido(`${chave}:margem:${nome}:${periodo}`, 0.35) * 6,
    };
  });
}

function construirTop10(): Pick<TvData, "top10Clientes" | "top10Nacional" | "top10Internacional"> {
  const top10Clientes = {} as Record<PeriodoTv, Top10LinhaTv[]>;
  const top10Nacional = {} as Record<PeriodoTv, Top10LinhaTv[]>;
  const top10Internacional = {} as Record<PeriodoTv, Top10LinhaTv[]>;

  for (const periodo of PERIODOS) {
    top10Clientes[periodo] = construirTop10DoPeriodo(
      NOMES_AGENCIAS_TOP,
      "top10clientes",
      periodo,
      312_000,
    );
    top10Nacional[periodo] = construirTop10DoPeriodo(
      NOMES_AGENCIAS_NACIONAL,
      "top10nacional",
      periodo,
      248_000,
    );
    top10Internacional[periodo] = construirTop10DoPeriodo(
      NOMES_AGENCIAS_INTERNACIONAL,
      "top10internacional",
      periodo,
      96_000,
    );
  }

  return { top10Clientes, top10Nacional, top10Internacional };
}

async function obterDadosMock(): Promise<TvData> {
  const vendasECanais = construirVendasECanais();
  const shareAereo = construirShareAereo();
  const top10 = construirTop10();

  return { ...vendasECanais, shareAereo, ...top10 };
}

export const tvMockService = {
  obterDados: obterDadosMock,
};
