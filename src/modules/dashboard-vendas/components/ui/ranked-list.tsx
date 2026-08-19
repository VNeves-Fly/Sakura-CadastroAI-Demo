import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface RankedListItem {
  posicao?: number;
  icone?: ReactNode;
  nome: string;
  subtitulo?: string;
  valorPrincipal: string;
  valorSecundario?: string;
}

interface RankedListProps {
  icon: LucideIcon;
  titulo: string;
  subtitulo: string;
  acoes?: ReactNode;
  // Conteúdo extra entre o cabeçalho e a lista — hoje só o filtro
  // "Personalizado" (campos de data + aviso), mostrado quando o toggle
  // de período está nesse valor (pedido do usuário, 2026-08-18).
  extra?: ReactNode;
  itens: RankedListItem[];
  // Opcional — card inteiro fica clicável (abre modal com o ranking
  // completo). `acoes`/`extra` (toggle e campos de data) param a
  // propagação, senão interagir com eles também abriria o modal.
  aoClicar?: () => void;
}

// Lista numerada com header + seletor de período à direita — "Top 10
// Agências"/"Top 10 Fornecedores" (4.10).
export function RankedList({
  icon: Icon,
  titulo,
  subtitulo,
  acoes,
  extra,
  itens,
  aoClicar,
}: RankedListProps) {
  return (
    <div
      role={aoClicar ? "button" : undefined}
      tabIndex={aoClicar ? 0 : undefined}
      onClick={aoClicar}
      onKeyDown={
        aoClicar
          ? (evento) => {
              if (evento.key === "Enter" || evento.key === " ") aoClicar();
            }
          : undefined
      }
      className={`border-border bg-card flex flex-col rounded-2xl border p-5 text-left ${
        aoClicar ? "hover:border-primary/40 cursor-pointer transition" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div>
            <h2 className="text-foreground text-sm font-semibold">{titulo}</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">{subtitulo}</p>
          </div>
        </div>
        {acoes ? <div onClick={(evento) => evento.stopPropagation()}>{acoes}</div> : null}
      </div>

      {/* justify-end: o filtro de tipo de rota fica alinhado à direita,
          junto do toggle de período de cima (pedido do usuário,
          2026-08-19) — antes ficava colado à esquerda. */}
      {extra ? (
        <div className="mt-3 flex justify-end" onClick={(evento) => evento.stopPropagation()}>
          {extra}
        </div>
      ) : null}

      <ul className="mt-3 flex flex-col gap-2.5">
        {itens.map((item, indice) => (
          <li key={`${item.nome}-${indice}`} className="flex items-center gap-3">
            {item.posicao ? (
              <span className="text-muted-foreground w-4 shrink-0 text-xs font-bold">
                {item.posicao}
              </span>
            ) : null}
            {item.icone}
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">{item.nome}</p>
              {item.subtitulo ? (
                <p className="text-muted-foreground text-xs">{item.subtitulo}</p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-foreground text-sm font-bold">{item.valorPrincipal}</p>
              {item.valorSecundario ? (
                <p className="text-muted-foreground text-xs">{item.valorSecundario}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
