import { ChevronRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListaAgenciasTabela } from "@/modules/novas-agencias/components/lista-agencias-tabela";
import { formatarNumero } from "@/modules/novas-agencias/utils/formatar.util";
import type { AgenciaNovaLinha } from "@/modules/novas-agencias/types/novas-agencias.types";

interface ListaAgenciasCardProps {
  agencias: AgenciaNovaLinha[]; // já filtradas
  totalAgencias: number; // total da base (agencias.length não filtrado, ver novas-agencias-view.tsx)
  filtro: "nunca" | "comprando" | null;
  onLimparFiltro: () => void;
  // Levantado pro componente pai (não é state local, como nos outros
  // toggles do módulo): o filtro por KPI do funil precisa forçar
  // `aberta = true` ao selecionar, então quem manda no estado é a View.
  aberta: boolean;
  onToggleAberta: () => void;
}

const CHIP_ROTULO: Record<"todas" | "nunca" | "comprando", string> = {
  todas: "Todas as situações",
  nunca: "Nunca compraram",
  comprando: "Comprando (90d)",
};

// Card "Lista de agências" (SPEC 8) — título com toggle+CSV, barra de
// filtros (busca/select/checkbox são só visuais, SPEC 10.6), tabela e
// rodapé. `listaAberta` é estado local — só este card usa.
export function ListaAgenciasCard({
  agencias,
  totalAgencias,
  filtro,
  onLimparFiltro,
  aberta,
  onToggleAberta,
}: ListaAgenciasCardProps) {
  const chipChave = filtro ?? "todas";
  const resumoLista = filtro
    ? `Mostrando ${formatarNumero(agencias.length)} agências filtradas`
    : `Mostrando ${formatarNumero(agencias.length)} de ${formatarNumero(totalAgencias)} agências`;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#ECECF4] bg-white shadow-[0_1px_2px_rgba(20,20,50,0.04)]">
      <div className="flex items-center justify-between gap-4 px-[22px] pt-[18px]">
        <button
          type="button"
          onClick={onToggleAberta}
          className="-ml-1.5 flex items-center gap-2.5 rounded-full py-1.5 pr-2.5 pl-1.5 text-[#1A1A2E] transition-colors duration-150 hover:bg-[#F6F4FA] active:scale-[0.98]"
        >
          <ChevronRight
            className={cn("size-3.5 transition-transform duration-200", aberta && "rotate-90")}
            strokeWidth={2.2}
          />
          <span className="text-[15px] font-bold tracking-[-0.01em]">Lista de agências</span>
        </button>

        <div className="flex items-center gap-3.5">
          <span className="text-xs text-[#8888AA]">{formatarNumero(totalAgencias)} agências</span>
          <button
            type="button"
            className="flex h-[34px] items-center gap-2 rounded-full border border-[#E4E4EE] bg-white px-3.5 text-[13px] font-medium text-[#2A2A40] transition-colors duration-150 hover:bg-[#FAFAFD] active:scale-[0.96]"
          >
            <Download className="size-[15px]" strokeWidth={2} />
            CSV
          </button>
        </div>
      </div>

      {!aberta ? (
        <div className="px-[22px] pt-2 pb-[18px] text-xs text-[#8888AA]">
          Lista oculta — clique na seta para exibir as {formatarNumero(totalAgencias)} agências.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5 px-[22px] pt-4 pb-[18px]">
            <div className="flex h-9 min-w-[280px] items-center gap-2 rounded-full border border-[#E2E2EE] bg-[#FBFBFE] px-3.5">
              <span className="text-xs text-[#A9A9C0]">⌕</span>
              <span className="text-[13px] text-[#A9A9C0]">Nome, CNPJ ou ID ERP…</span>
            </div>

            <button
              type="button"
              onClick={onLimparFiltro}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold",
                filtro
                  ? "border-[rgba(233,30,140,0.35)] bg-[rgba(233,30,140,0.10)] text-[#C2185B]"
                  : "border-[#E2E2EE] bg-white text-[#3A3A55]",
              )}
            >
              {CHIP_ROTULO[chipChave]}
              <span className="text-[11px] opacity-60">{filtro ? "✕" : "▾"}</span>
            </button>

            <div className="flex h-9 items-center gap-2 rounded-full border border-[#E2E2EE] bg-white px-3.5 text-[13px] font-semibold text-[#3A3A55]">
              Todos os executivos
              <span className="text-[11px] text-[#A9A9C0]">▾</span>
            </div>

            <label className="flex items-center gap-2 text-[13px] text-[#3A3A55]">
              <span className="border-primary inline-block size-[15px] rounded border-[1.5px]" />
              Apenas agências que compraram
            </label>
          </div>

          <ListaAgenciasTabela agencias={agencias} />

          <div className="flex items-center justify-between px-[22px] py-3.5 text-xs text-[#8888AA]">
            <span>{resumoLista}</span>
            <div className="flex gap-2">
              <span className="rounded-full border border-[#E2E2EE] px-3 py-1.5 text-[#C9C9DA]">
                Anterior
              </span>
              <span className="rounded-full border border-[#E2E2EE] px-3 py-1.5 font-semibold text-[#3A3A55]">
                Próxima
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
