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
      // Quadrado com cantos arredondados, no mesmo estilo dos cards
      // (`rounded-2xl`) — não é mais círculo (`rounded-full`); em 32/40px,
      // `rounded-2xl` (16px) vira círculo (50% do lado), então usa
      // `rounded-xl` (12px) pra manter a mesma linguagem visual do card
      // sem virar bolinha (pedido do usuário, 2026-08-20, print de
      // referência).
      className="flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-12"
      style={{ backgroundColor: corFundoIcone }}
    >
      <Icon className="size-5 sm:size-6" style={{ color: cor }} />
    </span>
  );

  const temBadge = Boolean(badgeTopo || badgeRodape);

  const texto = (
    // `flex-1 min-w-0`: o bloco de texto sempre ocupa o espaço disponível
    // na linha ícone+texto. No horizontal com badge (agora no canto
    // superior direito, absoluto — pedido do usuário, 2026-08-21), reserva
    // um respiro à direita (`pr-16/24`) pra o valor não passar por baixo
    // do badge — mesma preocupação do bug de 2026-08-19, resolvida agora
    // com padding em vez de mover o badge pra linha de baixo.
    <div
      className={
        horizontal ? (temBadge ? "min-w-0 flex-1 pr-16 sm:pr-24" : "min-w-0 flex-1") : "min-w-0"
      }
    >
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

  if (horizontal) {
    return (
      <div className="border-border bg-card relative flex flex-col gap-2 rounded-2xl border p-4 sm:p-5">
        {badgeTopo || badgeRodape ? (
          // Canto superior direito — lado oposto ao valor, que fica à
          // esquerda junto do ícone (pedido do usuário, 2026-08-21; antes
          // ficava numa linha própria abaixo, indentada).
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1 sm:top-5 sm:right-5">
            {badgeTopo ? (
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ backgroundColor: corFundoIcone, color: cor }}
              >
                {badgeTopo}
              </span>
            ) : null}
            {badgeRodape ? (
              // Rosa sem fundo (pedido do usuário, 2026-08-21) — sem
              // pill/borda, só o texto na cor primária.
              <span className="text-primary text-sm font-bold tracking-wide sm:text-base">
                {badgeRodape}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center gap-2 sm:gap-3">
          {icone}
          {texto}
        </div>
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
        // Rosa sem fundo (pedido do usuário, 2026-08-21) — mesmo tratamento
        // do modo horizontal acima.
        <span className="text-primary absolute right-4 bottom-4 text-sm font-bold tracking-wide sm:text-base">
          {badgeRodape}
        </span>
      ) : null}
    </div>
  );
}
