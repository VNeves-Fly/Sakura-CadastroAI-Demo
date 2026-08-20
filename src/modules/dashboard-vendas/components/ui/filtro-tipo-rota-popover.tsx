"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { OPCOES_TIPO_ROTA, type TipoRota } from "@/modules/dashboard-vendas/utils/tipo-rota.util";

interface FiltroTipoRotaPopoverProps {
  valor: TipoRota;
  onChange: (valor: TipoRota) => void;
}

const LABEL_TIPO_ROTA: Record<TipoRota, string> = {
  todos: "Todos",
  nacional: "Nacional",
  internacional: "Internacional",
};

// Filtro Nacional/Internacional/Todos escondido atrás de um botão
// "Filtrar" — antes ficava sempre visível como toggle fixo, ocupando
// espaço mesmo quando o usuário nunca troca de "Todos" (pedido do
// usuário, 2026-08-20, pra reduzir a ocupação dos filtros nos cards de
// ranking). Clicar numa opção já aplica e fecha na hora — sem passo de
// "Aplicar" — mesma lógica dos atalhos do filtro por tempo
// (filtro-periodo-dashboard-popover.tsx; pedido do usuário, 2026-08-20).
export function FiltroTipoRotaPopover({ valor, onChange }: FiltroTipoRotaPopoverProps) {
  const [aberto, setAberto] = useState(false);
  const ativo = valor !== "todos";

  function selecionar(opcao: TipoRota) {
    onChange(opcao);
    setAberto(false);
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "bg-background inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition sm:px-3",
              aberto || ativo
                ? "border-primary/40 text-primary"
                : "border-input text-muted-foreground hover:text-foreground",
            )}
          />
        }
      >
        <Filter className="size-3.5" />
        <span>Filtrar{ativo ? ` · ${LABEL_TIPO_ROTA[valor]}` : ""}</span>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-auto p-3">
        <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
          Tipo de rota
        </p>

        {/* Segmented control com tokens globais (bg-primary/text-primary-
            foreground), não os `--dv-*` do PeriodToggle — este popover é
            renderizado num Portal (ver components/ui/popover.tsx), fora da
            árvore com a classe "dashboard-vendas-scope" que dá vida às
            variáveis `--dv-*`; usá-las aqui deixava o item selecionado sem
            cor nenhuma (reportado pelo usuário, 2026-08-20). */}
        <div className="bg-muted flex shrink-0 items-center gap-0.5 rounded-lg p-1">
          {OPCOES_TIPO_ROTA.map((opcao) => {
            const opcaoAtiva = valor === opcao.valor;
            return (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => selecionar(opcao.valor)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-bold whitespace-nowrap transition",
                  opcaoAtiva
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opcao.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
