"use client";

import { Eye } from "lucide-react";
import { BotaoNovoCadastro } from "@/modules/shared/components/botao-novo-cadastro";
import { BuscaListaInput } from "@/modules/shared/components/busca-lista-input";
import { cn } from "@/lib/utils";

interface GestoresListaToolbarProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  total: number;
  minutosDesdeAtualizacao: number | null;
  carregando: boolean;
  onVisualizarDados: () => void;
  onNovoCadastro: () => void;
}

// "Atualizado há X min" (SPEC pedida pelo usuário, 2026-08-17) — só existe
// depois do primeiro clique em "Visualizar dados" (ver
// use-gestores-lista.view-model.ts); antes disso a tela não fez nenhuma
// carga de indicador ainda.
function textoAtualizacao(minutos: number | null): string | null {
  if (minutos === null) return null;
  if (minutos < 1) return "Atualizado agora";
  return `Atualizado há ${minutos} min`;
}

export function GestoresListaToolbar({
  busca,
  onBuscaChange,
  total,
  minutosDesdeAtualizacao,
  carregando,
  onVisualizarDados,
  onNovoCadastro,
}: GestoresListaToolbarProps) {
  const atualizacao = textoAtualizacao(minutosDesdeAtualizacao);

  return (
    <div className="border-border flex flex-wrap items-center gap-4 border-b pb-4">
      <BuscaListaInput value={busca} onChange={onBuscaChange} placeholder="Buscar gerente..." />

      <div className="ml-auto flex items-center gap-3">
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {atualizacao ? `${atualizacao} · ` : ""}
          <span className="text-foreground font-semibold">{total}</span> resultado(s)
        </span>

        <button
          type="button"
          onClick={onVisualizarDados}
          disabled={carregando}
          title={carregando ? "Carregando..." : "Visualizar dados"}
          // Mesmo botão de olho circular do ToggleVisibilidadeButton (usado
          // em /crm/executivos) — reaproveitado aqui pra não criar um
          // segundo padrão visual pro mesmo tipo de ação (pedido do
          // usuário, 2026-08-17).
          className={cn(
            "border-border text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-full border transition",
            carregando && "cursor-not-allowed opacity-60",
          )}
        >
          <Eye className="size-4" />
        </button>

        <BotaoNovoCadastro onClick={onNovoCadastro} />
      </div>
    </div>
  );
}
