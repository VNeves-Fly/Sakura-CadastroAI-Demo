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

  const texto = (
    // `flex-1 min-w-0`: o bloco de texto sempre ocupa o espaço disponível
    // na linha ícone+texto — no horizontal, essa linha não compete mais
    // com o badge (que foi pra linha de baixo, ver comentário mais
    // abaixo), então isso não força mais o valor a quebrar no meio de um
    // número (bug reportado pelo usuário, 2026-08-19).
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

  // No modo horizontal, o badge fica numa linha própria abaixo de
  // ícone+texto (não mais ao lado, com `ml-auto`) — colocar os dois na
  // mesma linha fazia o bloco de texto encolher pra abrir espaço pro
  // badge, e em telas médias isso podia forçar o valor a quebrar no meio
  // de um número (ex.: "R$ 282.267,4" / "9"). Com o badge numa linha
  // separada, o valor sempre tem a largura inteira do card disponível, e
  // as duas linhas ficam no mesmo lugar em qualquer card horizontal,
  // independente do tamanho da legenda ou do badge (bug reportado pelo
  // usuário, 2026-08-19).
  if (horizontal) {
    return (
      <div className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-4 sm:p-5">
        <div className="flex items-center gap-2 sm:gap-3">
          {icone}
          {texto}
        </div>
        {badgeTopo || badgeRodape ? (
          // Indentado pra alinhar com o bloco de texto (ícone + gap: 40/48px
          // + 8/12px), não mais colado na borda esquerda do card junto do
          // ícone — print de referência do usuário, 2026-08-20.
          <div className="ml-12 flex flex-wrap items-center gap-1.5 sm:ml-[60px] sm:gap-2">
            {badgeTopo ? (
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ backgroundColor: corFundoIcone, color: cor }}
              >
                {badgeTopo}
              </span>
            ) : null}
            {badgeRodape ? (
              // Cinza/preto fixo — não é mais a cor do canal (rosa/azul):
              // é uma margem, não um dado "daquele" canal, então não devia
              // herdar a identidade visual dele (pedido do usuário,
              // 2026-08-20).
              <span className="text-foreground bg-muted rounded-md border border-neutral-400 px-3 py-1 text-sm font-bold tracking-wide sm:px-3.5 sm:py-1.5 sm:text-base">
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
        // Mesmo cinza/preto fixo do modo horizontal acima — margem não
        // herda a cor do canal (pedido do usuário, 2026-08-20).
        <span className="text-foreground bg-muted absolute right-4 bottom-4 rounded-md border border-neutral-400 px-3 py-1 text-sm font-bold tracking-wide sm:px-3.5 sm:py-1.5 sm:text-base">
          {badgeRodape}
        </span>
      ) : null}
    </div>
  );
}
