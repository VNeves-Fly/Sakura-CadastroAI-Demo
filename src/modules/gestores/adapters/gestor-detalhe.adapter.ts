import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { nivelSeed } from "@/modules/gestores/types/gestor-nivel.types";
import type { AgenciaResumoPromotor } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type {
  AgenciaSegmentoResumo,
  CanalResumoGestor,
  GestorDetalheView,
  PeriodoVendasMesHeroGestor,
  RankingAgencia,
  RankingExecutivoSaude,
  SegmentoSaude,
  VendasMesHeroGestor,
} from "@/modules/gestores/types/gestor-detalhe.types";

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

// Card hero (SPEC 3.5) com filtro Dia/Ontem/Mês/Ano — mesma lógica de
// gerarHeroPorPeriodo em executivo-detalhe.adapter.ts: cada período tem
// seu próprio mock determinístico a partir do valor mensal já calculado.
function gerarHeroPorPeriodo(
  base: number,
  valorMesAtual: number,
  bilhetesMes: number,
  variacaoPct: number,
  vendendoUltimos30d: number,
  totalAgencias: number,
): Record<PeriodoVendasMesHeroGestor, VendasMesHeroGestor> {
  const diasNoMes = 28 + (base % 3);
  const diaValor = Math.round(valorMesAtual / diasNoMes);
  const diaBilhetes = Math.max(1, Math.round(bilhetesMes / diasNoMes));
  const fatorOntem = 0.7 + ((base >> 2) % 60) / 100;
  const anoMultiplicador = 6 + (base % 6);

  return {
    dia: {
      valor: diaValor,
      bilhetes: diaBilhetes,
      agenciasVendendo: Math.max(1, Math.round(vendendoUltimos30d * 0.2)),
      variacaoPct,
    },
    ontem: {
      valor: Math.round(diaValor * fatorOntem),
      bilhetes: Math.max(1, Math.round(diaBilhetes * fatorOntem)),
      agenciasVendendo: Math.max(1, Math.round(vendendoUltimos30d * 0.18)),
      variacaoPct,
    },
    mes: {
      valor: valorMesAtual,
      bilhetes: bilhetesMes,
      agenciasVendendo: vendendoUltimos30d,
      variacaoPct,
    },
    ano: {
      valor: Math.round(valorMesAtual * anoMultiplicador),
      bilhetes: bilhetesMes * anoMultiplicador,
      agenciasVendendo: totalAgencias,
      variacaoPct,
    },
  };
}

// Resumo dos canais Aéreo/Terrestre do card de receita total (SPEC 3.6) —
// mesma lógica/valores de gerarCanalAereo/gerarCanalTerrestre em
// executivo-detalhe.adapter.ts (duplicada por isolamento de módulo).
function gerarCanalAereo(base: number): CanalResumoGestor {
  const nacPct = Math.round((28 + (base % 25)) * 10) / 10;
  const margemPct = Math.round((2.6 + ((base >> 3) % 25) / 10) * 100) / 100;
  const margemNegativa = (base >> 9) % 5 === 0;
  return {
    participacaoPct: Math.round((95 + ((base >> 5) % 45) / 10) * 100) / 100,
    margemPct,
    margemLYPct: Math.round((margemPct - (0.2 + ((base >> 7) % 12) / 10)) * 100) / 100,
    margemVariacaoPct:
      (margemNegativa ? -1 : 1) * (Math.round((5 + ((base >> 9) % 250) / 10) * 100) / 100),
    rentabLYPct: Math.round((1.8 + ((base >> 11) % 60) / 10) * 100) / 100,
    rentabLYVariacaoPct: Math.round((15 + ((base >> 13) % 550) / 10) * 100) / 100,
    ticketMedio: 1_900 + (base % 1_600),
    nacPct,
    intPct: Math.round((100 - nacPct) * 10) / 10,
  };
}

function gerarCanalTerrestre(base: number, participacaoAereoPct: number): CanalResumoGestor {
  const nacPct = Math.round((75 + ((base >> 2) % 20)) * 10) / 10;
  const margemPct = Math.round((8 + ((base >> 4) % 60) / 10) * 100) / 100;
  const margemNegativa = base % 2 === 0;
  return {
    participacaoPct: Math.round((100 - participacaoAereoPct) * 100) / 100,
    margemPct,
    margemLYPct: Math.round((margemPct + (1 + ((base >> 6) % 30) / 10)) * 100) / 100,
    margemVariacaoPct:
      (margemNegativa ? -1 : 1) * (Math.round((5 + ((base >> 8) % 220) / 10) * 100) / 100),
    rentabLYPct: Math.round((6 + ((base >> 10) % 90) / 10) * 100) / 100,
    rentabLYVariacaoPct: Math.round((2 + ((base >> 12) % 60) / 10) * 100) / 100,
    ticketMedio: 350 + (base % 500),
    nacPct,
    intPct: Math.round((100 - nacPct) * 10) / 10,
  };
}

// "Atualizado em DD/MM às HH:mm" (SPEC 3.5) — mesma lógica de
// gerarAtualizadoEm em executivo-detalhe.adapter.ts.
function gerarAtualizadoEm(base: number): string {
  const minutosAtras = 5 + (base % 180);
  const data = new Date(Date.now() - minutosAtras * 60_000);
  const doisDigitos = (n: number) => String(n).padStart(2, "0");
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)} às ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

// Rankings "Top 10 Agências" (SPEC 3.9) — sempre "hoje", por modalidade.
// Mesma lógica de gerarRankingHoje em executivo-detalhe.adapter.ts, mas
// sobre a carteira consolidada de todos os executivos deste gestor.
function gerarRankingHoje(
  agencias: AgenciaResumoPromotor[],
  seedBase: number,
  valorMaximo: number,
  ticketMedio: number,
): RankingAgencia[] {
  return agencias
    .map((agencia, indice) => {
      const seed = hashParaNumero(agencia.id + seedBase + indice);
      const valor = 500 + (seed % valorMaximo);
      return {
        nome: agencia.razaoSocial,
        valor,
        quantidade: Math.max(1, Math.round(valor / ticketMedio)),
      };
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)
    .map((item, indice) => ({ posicao: indice + 1, ...item }));
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
      label: "Agências Carteira Click",
      descricao: "Vendem sem crédito",
      quantidade: potenciais,
      pct: pct(potenciais),
      agencias: gerarListaAgenciasSegmento(potenciais, base + 202),
    },
    {
      chave: "ociosas",
      label: "Agências ociosas (limite de crédito parado)",
      descricao: "Sem compra há +90d",
      quantidade: ociosas,
      pct: pct(ociosas),
      agencias: gerarListaAgenciasSegmento(ociosas, base + 303),
    },
    {
      chave: "inativas",
      label: "Agências sem venda por 60 dias",
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

  const vendendoUltimos30d = Math.round(totalAgencias * (0.3 + (base % 50) / 100));
  const vendendoUltimos30dPct =
    totalAgencias > 0 ? Math.round((vendendoUltimos30d / totalAgencias) * 100) : 0;

  // Escala com o tamanho da carteira (mock) — um gestor com mais agências
  // sob gestão naturalmente movimenta mais volume que um executivo sozinho.
  const valorPorAgencia = 15_000 + (base % 40_000);
  const valorMesAtual = Math.max(
    50_000,
    Math.round(totalAgencias * valorPorAgencia * (0.6 + (base % 60) / 100)),
  );
  const bilhetesMes = Math.max(1, Math.round(valorMesAtual / (1_800 + (base % 900))));
  const variacaoPct = ((base % 40) - 20) / 10;

  const projecaoFimMes = Math.round(valorMesAtual * (1.1 + ((base >> 5) % 25) / 100));
  const mesAnteriorValor = Math.round(valorMesAtual * (0.85 + ((base >> 3) % 30) / 100));
  const percentualAtingido =
    mesAnteriorValor > 0 ? Math.round((valorMesAtual / mesAnteriorValor) * 100) : 0;

  const canalAereo = gerarCanalAereo(base);
  const canalTerrestre = gerarCanalTerrestre(base, canalAereo.participacaoPct);
  const agenciasCarteira = carteira.map(({ agencia }) => agencia);

  const rankingExecutivos = gerarRankingExecutivos(executivos);
  const melhorSaude = [...rankingExecutivos].sort((a, b) => b.pct - a.pct).slice(0, 5);
  const atencao = [...rankingExecutivos].sort((a, b) => a.pct - b.pct).slice(0, 5);

  return {
    hero: gerarHeroPorPeriodo(
      base,
      valorMesAtual,
      bilhetesMes,
      variacaoPct,
      vendendoUltimos30d,
      totalAgencias,
    ),
    kpis: {
      mesAnteriorValor,
      mesAnteriorFaltaValor: Math.max(0, mesAnteriorValor - valorMesAtual),
      mesAnteriorPercentualAtingido: percentualAtingido,
      projecaoFimMes,
      vendendo30d: vendendoUltimos30d,
      vendendo30dPct: vendendoUltimos30dPct,
    },
    atualizadoEm: gerarAtualizadoEm(base),
    canalAereo,
    canalTerrestre,
    saudeCarteira: gerarSaudeCarteira(totalAgencias, base),
    topAgenciasHoje: gerarRankingHoje(agenciasCarteira, base + 801, 350_000, 1_200),
    topAgenciasHojeAereo: gerarRankingHoje(agenciasCarteira, base + 902, 340_000, 2_400),
    topAgenciasHojeTerrestre: gerarRankingHoje(agenciasCarteira, base + 1_003, 13_000, 500),
    topExecutivosMelhorSaude: melhorSaude,
    topExecutivosAtencao: atencao,
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
