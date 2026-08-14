"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

type Periodo = "dia" | "mes" | "ano";

const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: "dia", label: "DIA" },
  { valor: "mes", label: "MÊS" },
  { valor: "ano", label: "ANO" },
];

// Mesmo shape de SeriePeriodoItem (ver agencia-repository.ts), mas
// definido localmente (duck-typed) — mesma convenção dos componentes
// irmãos (GraficoContratosPorDia, GraficoOrigemContrato), que também não
// importam tipo de domínio do módulo cadastro.
interface SeriePeriodoItem {
  periodo: string;
  quantidade: number;
}

interface DashboardKpiCardProps {
  icon: LucideIcon;
  titulo: string;
  valor: string;
  descricao: string;
  cor: string;
  series: { dia: SeriePeriodoItem[]; mes: SeriePeriodoItem[]; ano: SeriePeriodoItem[] };
}

// Mapeia as quantidades reais (inteiros pequenos, ex.: 0-8 movimentações
// por dia) pra faixa 0.08-0.90 que o desenho do SVG espera — sem isso, a
// curva ficaria colada no topo ou no fundo dependendo da escala real.
// Todos zero (nenhuma movimentação na janela) desenha uma linha baixa e
// reta, em vez de dividir por zero.
function normalizarSerie(quantidades: number[]): number[] {
  const max = Math.max(0, ...quantidades);
  if (max === 0) return quantidades.map(() => 0.08);
  return quantidades.map((v) => 0.08 + (v / max) * 0.82);
}

// Catmull-Rom → Bézier cúbica, pra desenhar uma curva suave passando pelos
// pontos (em vez de segmentos retos) — dá o efeito "movimentação suave".
function caminhoSuave(coords: [number, number][]): string {
  if (coords.length < 2) return "";
  let d = `M ${coords[0]![0]},${coords[0]![1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i]!;
    const p1 = coords[i]!;
    const p2 = coords[i + 1]!;
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
}

const LARGURA = 200;
const ALTURA = 64;

// Mini-gráfico isolado ao lado do número (não é mais fundo do card inteiro
// — pedido do usuário, 2026-07-30: a linha não pode atravessar o número, e
// sim "começar a partir dele"; por isso mora num container próprio, à
// direita do valor, sem nunca ocupar o mesmo espaço do texto).
function GraficoAoLadoDoNumero({
  cor,
  seed,
  quantidades,
}: {
  cor: string;
  seed: string;
  quantidades: number[];
}) {
  const id = slug(seed);

  const { caminho, ultimoPonto } = useMemo(() => {
    const pontos = normalizarSerie(quantidades);
    // Só 3% de folga nas pontas (pro marcador de "agora" não cortar na
    // borda) — aqui a área é só do gráfico, então usa quase 100% dela.
    const coords: [number, number][] = pontos.map((v, i) => [
      LARGURA * 0.03 + (i / Math.max(pontos.length - 1, 1)) * LARGURA * 0.94,
      ALTURA * 0.9 - v * ALTURA * 0.75,
    ]);
    return { caminho: caminhoSuave(coords), ultimoPonto: coords[coords.length - 1]! };
  }, [quantidades]);

  return (
    <svg
      key={seed}
      className="animate-in fade-in-0 pointer-events-none h-full w-full duration-700"
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <pattern id={`grid-${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke={cor} strokeWidth="1" />
        </pattern>
        <linearGradient id={`fade-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="30%" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={`mask-${id}`}>
          <rect width="100%" height="100%" fill={`url(#fade-${id})`} />
        </mask>
        <linearGradient id={`linha-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={cor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={cor} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
        <filter id={`brilho-${id}`} x="-20%" y="-50%" width="140%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={cor} floodOpacity="0.5" />
        </filter>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill={`url(#grid-${id})`}
        mask={`url(#mask-${id})`}
        opacity={0.55}
      />

      {/* Preenchimento sob a curva — reforça a leitura de "tendência viva"
          sem precisar de animação de verdade (pedido do usuário, 2026-07-30:
          dar a sensação de movimento, sem ficar de fato em movimento). */}
      <path
        d={`${caminho} L ${LARGURA},${ALTURA} L 0,${ALTURA} Z`}
        fill={`url(#area-${id})`}
        stroke="none"
      />

      <path
        d={caminho}
        fill="none"
        stroke={`url(#linha-${id})`}
        strokeWidth="3"
        strokeLinecap="round"
        filter={`url(#brilho-${id})`}
      />

      {/* Ponta direita = "agora" — marcador estático (halo + ponto sólido),
          não animado. */}
      <circle cx={ultimoPonto[0]} cy={ultimoPonto[1]} r="6" fill={cor} opacity={0.22} />
      <circle cx={ultimoPonto[0]} cy={ultimoPonto[1]} r="3" fill={cor} />
    </svg>
  );
}

// Troca de período (Dia/Mês/Ano) busca a série real correspondente em
// `series` (contagem de HistoricoEtapaCadastro por período, ver
// listarSeriesMovimentacoes) — o número grande (`valor`) continua fixo
// (sempre a janela padrão da métrica, ex.: "últimos 30 dias"), só o
// mini-gráfico muda de granularidade.
export function DashboardKpiCard({
  icon: Icon,
  titulo,
  valor,
  descricao,
  cor,
  series,
}: DashboardKpiCardProps) {
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const quantidades = series[periodo].map((item) => item.quantidade);

  return (
    <div className="border-border bg-card flex min-w-0 flex-1 flex-col rounded-2xl border p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl sm:size-12"
            style={{ backgroundColor: cor }}
          >
            <Icon className="size-5 text-white sm:size-6" />
          </span>
          <h2
            className="min-w-0 truncate text-lg leading-tight font-extrabold sm:text-xl"
            style={{ color: cor }}
          >
            {titulo}
          </h2>
        </div>

        <div className="bg-muted flex shrink-0 items-center gap-1 rounded-full p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => setPeriodo(p.valor)}
              className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition sm:px-3 sm:text-xs ${
                periodo === p.valor
                  ? "text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={periodo === p.valor ? { backgroundColor: cor } : undefined}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Número é o destaque principal do card (pedido do usuário,
          2026-07-30: ele expressa o dado, tem que ser o mais visível) — o
          mini-gráfico fica ao lado, começando a partir dele, nunca por
          baixo/atravessando o texto. */}
      <div className="mt-4 flex min-w-0 items-center gap-3">
        <p className="text-foreground shrink-0 text-3xl font-black break-words sm:text-4xl">
          {valor}
        </p>
        <div className="h-12 min-w-0 flex-1 sm:h-14">
          <GraficoAoLadoDoNumero
            cor={cor}
            seed={`${titulo}-${periodo}`}
            quantidades={quantidades}
          />
        </div>
      </div>
      <p className="text-muted-foreground mt-1 text-xs break-words">{descricao}</p>
    </div>
  );
}
