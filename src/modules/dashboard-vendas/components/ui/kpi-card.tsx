import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface KpiCardProps {
  icon: LucideIcon;
  cor: string;
  corFundoIcone: string;
  label: string;
  valor: string;
  // ReactNode (não só string) pra dar pra empilhar mais de uma linha —
  // ex.: "X bilhetes" + "Ticket médio: R$ Y" nos cards Aéreo/Terrestre
  // do Resumo do dia (pedido do usuário, 2026-08-19).
  legenda?: ReactNode;
  badgeTopo?: string;
  badgeRodape?: string;
  // "vertical" (padrão) — ícone numa linha própria, acima do texto; usado
  // nos cards grandes Aéreo/Terrestre (4.1), que têm os badges de canto.
  // "horizontal" — ícone ao lado do bloco de texto, na mesma linha; usado
  // nos mini-KPIs (4.2) pra reduzir a altura/quantidade de linhas do card
  // e ajudar a responsividade (pedido do usuário, 2026-08-18).
  orientacao?: "vertical" | "horizontal";
}

// Ícone circular colorido + rótulo + valor + legenda, com até 2 badges
// nos cantos (participação/margem) — cards "Aéreo"/"Terrestre" (4.1) e
// base pros mini-KPIs (4.2). Sem `"use client"`: só recebe cores/textos,
// o ícone já vem resolvido de quem renderiza (ver nota de arquitetura
// sobre LucideIcon não atravessar a fronteira Server→Client como prop).
export function KpiCard({
  icon: Icon,
  cor,
  corFundoIcone,
  label,
  valor,
  legenda,
  badgeTopo,
  badgeRodape,
  orientacao = "vertical",
}: KpiCardProps) {
  const horizontal = orientacao === "horizontal";

  const icone = (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full sm:size-10"
      style={{ backgroundColor: corFundoIcone }}
    >
      <Icon className="size-4 sm:size-5" style={{ color: cor }} />
    </span>
  );

  const texto = (
    // `flex-1`: sem isso, o card horizontal (Aéreo/Terrestre) desalinhava
    // o badge de margem entre os dois lados — a legenda mais longa de um
    // card (mais caracteres em "X bilhetes"/"Ticket médio: R$ Y") fazia
    // só aquele lado quebrar linha (flex-wrap do container pai), com o
    // badge caindo pra baixo num card e ficando alinhado no outro. Com
    // `flex-1`, o bloco de texto sempre ocupa o espaço disponível e quebra
    // a própria linha (`break-words` já usado abaixo) em vez de empurrar
    // o layout do card inteiro (bug reportado pelo usuário, 2026-08-19).
    <div className={horizontal ? "min-w-0 flex-1" : "min-w-0"}>
      <p
        className="text-[10px] font-bold tracking-wide uppercase sm:text-[11px]"
        style={{ color: cor }}
      >
        {label}
      </p>
      {/* `break-words`: valores grandes (ex.: "R$ 1.320.800.000,00") são um
          token só, sem espaço no meio — sem isto o texto ultrapassa a
          borda do card em vez de quebrar linha em telas estreitas
          (min-w-0 só permite o container encolher, não quebra o texto
          — são duas regras de CSS diferentes; bug reportado pelo
          usuário, 2026-08-18). */}
      <p className="text-foreground mt-1 text-2xl font-black break-words sm:text-[28px]">{valor}</p>
      {legenda ? <p className="text-muted-foreground mt-0.5 text-xs">{legenda}</p> : null}
    </div>
  );

  // No modo horizontal, o card fica baixo o bastante pra um badge de
  // canto (`absolute`) acabar caindo em cima do valor/legenda em telas
  // estreitas (mobile é o público principal daqui) — por isso os badges
  // entram no fluxo normal do flex (`flex-wrap` + `ml-auto`), empurrados
  // pra direita quando há espaço e quebrando pra linha de baixo quando
  // não há, nunca sobrepondo o texto (pedido do usuário, 2026-08-18).
  if (horizontal) {
    return (
      <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-2xl border p-4 sm:gap-3 sm:p-5">
        {icone}
        {texto}
        {badgeTopo || badgeRodape ? (
          <div className="ml-auto flex flex-col items-end gap-1 sm:gap-1.5">
            {badgeTopo ? (
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ backgroundColor: corFundoIcone, color: cor }}
              >
                {badgeTopo}
              </span>
            ) : null}
            {badgeRodape ? (
              <span
                className="rounded-md px-3 py-1 text-sm font-bold tracking-wide sm:px-3.5 sm:py-1.5 sm:text-base"
                style={{ backgroundColor: corFundoIcone, color: cor }}
              >
                {badgeRodape}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="border-border bg-card relative flex flex-col gap-3 rounded-2xl border p-4 sm:p-5">
      {badgeTopo ? (
        <span
          className="absolute top-4 right-4 rounded-md px-2 py-0.5 text-[11px] font-bold"
          style={{ backgroundColor: corFundoIcone, color: cor }}
        >
          {badgeTopo}
        </span>
      ) : null}

      {icone}
      {texto}

      {badgeRodape ? (
        <span
          className="absolute right-4 bottom-4 rounded-md px-3 py-1 text-sm font-bold tracking-wide sm:px-3.5 sm:py-1.5 sm:text-base"
          style={{ backgroundColor: corFundoIcone, color: cor }}
        >
          {badgeRodape}
        </span>
      ) : null}
    </div>
  );
}
