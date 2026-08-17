import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { nivelSeed } from "@/modules/gestores/types/gestor-nivel.types";
import type { AgenciaResumoPromotor } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type {
  AcaoPrioritariaAgencia,
  AgenciaSegmentoResumo,
  GestorDetalheView,
  RankingExecutivoSaude,
  SegmentoSaude,
  VendaMensal,
} from "@/modules/gestores/types/gestor-detalhe.types";

const MESES_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export interface GestorRaw {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  bases: string[];
}

// Um executivo (Promotor) subordinado a este gestor, com as agências reais
// da sua carteira — usado tanto pra contar totais reais (executivos/
// agências) quanto pra ranquear "top executivos" e montar "ações
// prioritárias" com a base real de cada agência (derivada do executivo
// dono, já que Agencia não expõe a própria base diretamente). email/sica
// alimentam a aba Executivos do gestor (ver gestor-executivos-tab.adapter.ts).
export interface ExecutivoComCarteira {
  id: string;
  nome: string;
  email: string;
  sica: number | null;
  bases: string[];
  agencias: AgenciaResumoPromotor[];
}

function particionar<const T extends number[]>(
  total: number,
  pesos: T,
): { [K in keyof T]: number } {
  const somaPesos = pesos.reduce((acc, peso) => acc + peso, 0);
  if (total === 0 || somaPesos === 0) {
    return pesos.map(() => 0) as { [K in keyof T]: number };
  }
  const partes = pesos.map((peso) => Math.floor((total * peso) / somaPesos));
  const somaParcial = partes.reduce((acc, parte) => acc + parte, 0);
  partes[partes.length - 1] = (partes[partes.length - 1] ?? 0) + (total - somaParcial);
  return partes as { [K in keyof T]: number };
}

// "SAKURA Comercial" -> "GEST-SAKURA" — sem fonte real de identificador
// único hoje (model Gestor não tem esse campo), gerado a partir da
// primeira palavra do nome.
function gerarIdentificador(nome: string): string {
  const primeiraPalavra =
    nome
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .split(/\s+/)
      .filter(Boolean)[0] ?? "GESTOR";
  return `GEST-${primeiraPalavra.toUpperCase().slice(0, 12)}`;
}

function gerarVendasMensais(base: number, valorMesAtual: number): VendaMensal[] {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoCurto = String(hoje.getFullYear()).slice(-2);

  return Array.from({ length: mesAtual + 1 }, (_, indiceMes) => {
    const seed = base + indiceMes * 97;
    const ehMesAtual = indiceMes === mesAtual;
    const nacional = ehMesAtual
      ? Math.round(valorMesAtual * 0.3)
      : Math.round(valorMesAtual * (0.25 + (seed % 60) / 100));
    const internacional = Math.round(nacional * (1.8 + ((seed >> 3) % 60) / 100));
    const terrestre = Math.round(nacional * (0.01 + ((seed >> 5) % 4) / 100));
    return { mes: `${MESES_PT[indiceMes]}/${anoCurto}`, nacional, internacional, terrestre };
  });
}

function gerarTendencia30d(base: number, mediaDiaria: number): number[] {
  return Array.from({ length: 30 }, (_, dia) => {
    const seed = base + dia * 31;
    return Math.max(0, Math.round(mediaDiaria * (0.4 + (seed % 120) / 100)));
  });
}

const PREFIXOS_AGENCIA_MOCK = [
  "Turismo",
  "Viagens",
  "Tour",
  "Travel",
  "Turismundo",
  "Destinos",
  "Rotas",
  "Voyage",
];
const SUFIXOS_AGENCIA_MOCK = ["SP", "RJ", "FLN", "BSB", "CWB", "POA", "BHZ", "SSA", "REC", "MAO"];

function gerarCnpjMock(seed: number): string {
  const digitos = String(10_000_000_000_000 + (seed % 89_999_999_999_999)).padStart(14, "0");
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12, 14)}`;
}

function gerarListaAgenciasSegmento(quantidade: number, seedBase: number): AgenciaSegmentoResumo[] {
  return Array.from({ length: quantidade }, (_, indice) => {
    const seed = seedBase + indice * 53;
    const prefixo = PREFIXOS_AGENCIA_MOCK[seed % PREFIXOS_AGENCIA_MOCK.length]!;
    const sufixo = SUFIXOS_AGENCIA_MOCK[(seed >> 3) % SUFIXOS_AGENCIA_MOCK.length]!;
    return {
      nome: `${prefixo} ${sufixo} ${100 + (seed % 900)}`,
      cnpj: gerarCnpjMock(seed),
      valor: 5_000 + (seed % 300_000),
    };
  });
}

function gerarSaudeCarteira(total: number, base: number): SegmentoSaude[] {
  const [ativas, potenciais, ociosas, inativas] = particionar(total, [
    5 + (base % 10),
    2 + ((base >> 2) % 6),
    1 + ((base >> 4) % 4),
    1 + ((base >> 6) % 5),
  ]);
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  return [
    {
      chave: "ativas",
      label: "Ativas c/ crédito",
      descricao: "Vendendo nos últimos 30d",
      quantidade: ativas,
      pct: pct(ativas),
      agencias: gerarListaAgenciasSegmento(ativas, base + 101),
    },
    {
      chave: "potenciais",
      label: "Potenciais (s/ limite)",
      descricao: "Vendem sem crédito",
      quantidade: potenciais,
      pct: pct(potenciais),
      agencias: gerarListaAgenciasSegmento(potenciais, base + 202),
    },
    {
      chave: "ociosas",
      label: "Ociosas (limite parado)",
      descricao: "Sem compra há +90d",
      quantidade: ociosas,
      pct: pct(ociosas),
      agencias: gerarListaAgenciasSegmento(ociosas, base + 303),
    },
    {
      chave: "inativas",
      label: "Inativas",
      descricao: "Nunca compraram",
      quantidade: inativas,
      pct: pct(inativas),
      agencias: gerarListaAgenciasSegmento(inativas, base + 404),
    },
  ];
}

function gerarRankingExecutivos(executivos: ExecutivoComCarteira[]): RankingExecutivoSaude[] {
  return executivos.map((executivo) => {
    const base = hashParaNumero(executivo.id);
    const total = executivo.agencias.length;
    // Mock: fração de agências "vendendo nos últimos 30d" dessa carteira.
    // Executivos sem agência ficam com 0/0 -> 0%, igual ao exemplo de
    // referência (executivos recém-atribuídos, sem carteira ainda).
    const vendendo = total > 0 ? Math.round(total * ((base % 80) / 100)) : 0;
    const pct = total > 0 ? Math.round((vendendo / total) * 1000) / 10 : 0;
    return { id: executivo.id, nome: executivo.nome, vendendo, total, pct };
  });
}

// Cartão de identificação + KPIs de topo — compartilhado entre as 4 abas do
// detalhe do gestor (Dashboard/Executivos/Agenda/Agências). Extraído de
// montarGestorDetalheView pra cada aba poder buscar só isso, sem gerar o
// dashboard inteiro (bem mais pesado) à toa.
export function montarGestorPerfil(gestor: GestorRaw, executivos: ExecutivoComCarteira[]) {
  const base = hashParaNumero(gestor.id);
  const totalAgencias = executivos.reduce(
    (total, executivo) => total + executivo.agencias.length,
    0,
  );
  const totalExecutivos = executivos.length;
  const ativo = base % 10 !== 0; // mock — ~90% ativo (sem status real no model)
  const vendendoUltimos30d = Math.round(totalAgencias * (0.3 + (base % 50) / 100));
  const vendendoUltimos30dPct =
    totalAgencias > 0 ? Math.round((vendendoUltimos30d / totalAgencias) * 100) : 0;

  return {
    id: gestor.id,
    nome: gestor.nome,
    identificador: gerarIdentificador(gestor.nome),
    email: gestor.email,
    telefone: gestor.telefone,
    ativo,
    // Nível não é resolvido aqui — o override mora em localStorage
    // (gestor-niveis.store.ts), inacessível no servidor, e o campo ainda
    // não é exibido nesta página; seed determinístico como fallback neutro
    // até isso mudar.
    nivel: nivelSeed(gestor.id),
    bases: gestor.bases,
    basePrincipal: gestor.bases[0] ?? null,
    totalExecutivos,
    totalAgencias,
    vendendoUltimos30d,
    vendendoUltimos30dPct,
  };
}

export function montarGestorDashboard(
  gestor: GestorRaw,
  executivos: ExecutivoComCarteira[],
): GestorDetalheView["dashboard"] {
  const base = hashParaNumero(gestor.id);
  const carteira = executivos.flatMap((executivo) =>
    executivo.agencias.map((agencia) => ({ agencia, executivo })),
  );
  const totalAgencias = carteira.length;
  const totalExecutivos = executivos.length;

  const vendendoUltimos30d = Math.round(totalAgencias * (0.3 + (base % 50) / 100));

  // Escala com o tamanho da carteira (mock) — um gestor com mais agências
  // sob gestão naturalmente movimenta mais volume que um executivo sozinho.
  const valorPorAgencia = 15_000 + (base % 40_000);
  const valorMesAtual = Math.max(
    50_000,
    Math.round(totalAgencias * valorPorAgencia * (0.6 + (base % 60) / 100)),
  );
  const bilhetesMes = Math.max(1, Math.round(valorMesAtual / (1_800 + (base % 900))));
  const variacaoPct = ((base % 40) - 20) / 10;

  const percentualAtingido = 20 + (base % 55);
  const metaValor = Math.round(valorMesAtual / (percentualAtingido / 100));
  const faltaValor = Math.max(0, metaValor - valorMesAtual);
  const projecaoFimMes = Math.round(valorMesAtual * (1.1 + ((base >> 5) % 25) / 100));

  const mesAnteriorValor = Math.round(valorMesAtual * (0.85 + ((base >> 3) % 30) / 100));
  const hoje = new Date();
  const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const mesAnteriorMesReferencia = `${MESES_PT[mesAnterior.getMonth()]!.toLowerCase()}/${String(mesAnterior.getFullYear()).slice(-2)}`;

  const vendasMensais = gerarVendasMensais(base, valorMesAtual);
  const totais = vendasMensais.reduce(
    (acc, mes) => ({
      nacional: acc.nacional + mes.nacional,
      internacional: acc.internacional + mes.internacional,
    }),
    { nacional: 0, internacional: 0 },
  );
  const somaNacIntl = totais.nacional + totais.internacional;
  const vendasMensaisNacionalPct =
    somaNacIntl > 0 ? Math.round((totais.nacional / somaNacIntl) * 100) : 0;

  const ativasUltimos12m = Math.round(totalAgencias * (0.4 + ((base >> 7) % 40) / 100));
  const [soAereoQtd, soTerrestreQtd, ambosQtd] = particionar(ativasUltimos12m, [
    5 + (base % 10),
    1 + ((base >> 2) % 3),
    3 + ((base >> 4) % 6),
  ]);
  const pctCanal = (n: number) =>
    ativasUltimos12m > 0 ? Math.round((n / ativasUltimos12m) * 1000) / 10 : 0;

  const rankingExecutivos = gerarRankingExecutivos(executivos);
  const melhorSaude = [...rankingExecutivos].sort((a, b) => b.pct - a.pct).slice(0, 5);
  const atencao = [...rankingExecutivos].sort((a, b) => a.pct - b.pct).slice(0, 5);

  function paraAcaoPrioritaria(
    item: { agencia: AgenciaResumoPromotor; executivo: ExecutivoComCarteira },
    sufixoSeed: string,
    indice: number,
  ): AcaoPrioritariaAgencia {
    const seed = hashParaNumero(item.agencia.id + sufixoSeed + indice);
    return {
      nome: item.agencia.razaoSocial,
      cnpj: item.agencia.cnpj,
      base: item.executivo.bases[0] ?? null,
      volume365d: 20_000 + (seed % 500_000),
      diasSemComprar: 91 + (seed % 200),
    };
  }

  const paradasComHistorico = carteira
    .filter((_, indice) => (base + indice) % 3 === 0)
    .map((item, indice) => paraAcaoPrioritaria(item, "parada", indice))
    .sort((a, b) => b.diasSemComprar - a.diasSemComprar);

  const emQueda = carteira
    .filter((_, indice) => (base + indice) % 4 === 0)
    .map((item, indice) => paraAcaoPrioritaria(item, "queda", indice))
    .sort((a, b) => b.volume365d - a.volume365d);

  return {
    hero: {
      valor: valorMesAtual,
      variacaoPct,
      bilhetes: bilhetesMes,
      agenciasVendendo: vendendoUltimos30d,
      executivosAtivos: totalExecutivos,
      meta: { valor: metaValor, percentualAtingido, faltaValor, projecaoFimMes },
    },
    kpis: {
      mesAnteriorValor,
      mesAnteriorMesReferencia,
      projecaoFimMes,
      acumuladoAnoValor: Math.round(valorMesAtual * (6 + (base % 6))),
      acumuladoAnoBilhetes: bilhetesMes * (6 + (base % 6)),
      ticketMedio30d: Math.round(valorMesAtual / bilhetesMes),
    },
    vendasMensais,
    vendasMensaisTotalAno: totais.nacional + totais.internacional,
    vendasMensaisNacionalPct,
    vendasMensaisInternacionalPct: 100 - vendasMensaisNacionalPct,
    tendencia30d: gerarTendencia30d(base, valorMesAtual / 30),
    tendencia30dTotal: valorMesAtual,
    crossCanal: {
      ativasUltimos12m,
      aprovadas: totalAgencias,
      volAereo: Math.round(valorMesAtual * 0.92),
      volTerrestre: Math.round(valorMesAtual * 0.03),
      soAereo: {
        quantidade: soAereoQtd,
        pct: pctCanal(soAereoQtd),
        agencias: gerarListaAgenciasSegmento(soAereoQtd, base + 501),
      },
      soTerrestre: {
        quantidade: soTerrestreQtd,
        pct: pctCanal(soTerrestreQtd),
        agencias: gerarListaAgenciasSegmento(soTerrestreQtd, base + 602),
      },
      ambos: {
        quantidade: ambosQtd,
        pct: pctCanal(ambosQtd),
        agencias: gerarListaAgenciasSegmento(ambosQtd, base + 703),
      },
    },
    saudeCarteira: gerarSaudeCarteira(totalAgencias, base),
    topAgenciasMes: carteira
      .map(({ agencia }, indice) => ({
        nome: agencia.razaoSocial,
        valor: 5_000 + (hashParaNumero(agencia.id + indice) % 400_000),
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 20)
      .map((item, indice) => ({ posicao: indice + 1, ...item })),
    topAgenciasAno: carteira
      .map(({ agencia }, indice) => ({
        nome: agencia.razaoSocial,
        valor: 50_000 + (hashParaNumero(agencia.id + "ano" + indice) % 4_000_000),
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 20)
      .map((item, indice) => ({ posicao: indice + 1, ...item })),
    topExecutivosMelhorSaude: melhorSaude,
    topExecutivosAtencao: atencao,
    acoesPrioritarias: { paradasComHistorico, emQueda },
  };
}

export function montarGestorDetalheView(
  gestor: GestorRaw,
  executivos: ExecutivoComCarteira[],
): GestorDetalheView {
  return {
    perfil: montarGestorPerfil(gestor, executivos),
    dashboard: montarGestorDashboard(gestor, executivos),
  };
}
