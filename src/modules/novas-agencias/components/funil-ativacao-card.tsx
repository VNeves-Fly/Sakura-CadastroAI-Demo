import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarNumero } from "@/modules/novas-agencias/utils/formatar.util";
import type {
  FunilAtivacaoKpis,
  SituacaoAgenciaNova,
} from "@/modules/novas-agencias/types/novas-agencias.types";

type FiltroKpi = Extract<SituacaoAgenciaNova, "nunca" | "comprando"> | null;

interface FunilAtivacaoCardProps {
  funil: FunilAtivacaoKpis;
  filtro: FiltroKpi;
  onFiltrar: (filtro: "nunca" | "comprando") => void;
}

// Card "Funil de ativação" (SPEC 6) — 3 KPIs + barra empilhada. Os
// botões de seta nas colunas 2/3 fazem toggle do filtro que dirige a
// "Lista de agências" abaixo (mesmo estado, ver novas-agencias-view.tsx).
export function FunilAtivacaoCard({ funil, filtro, onFiltrar }: FunilAtivacaoCardProps) {
  return (
    <div className="flex flex-col gap-[18px] rounded-2xl border border-[#ECECF4] bg-white p-[22px_24px] shadow-[0_1px_2px_rgba(20,20,50,0.04)]">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[13px] font-medium tracking-[0.03em] text-[#3A3A55] uppercase">
          Funil de ativação
        </h2>
        <span className="text-xs text-[#8888AA]">
          base de {formatarNumero(funil.baseAprovadas)} agências aprovadas
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium tracking-[0.03em] text-[#3A3A55] uppercase">
            Novas agências
          </p>
          <p className="text-[34px] leading-none font-bold tracking-[-0.02em] text-[#1A1A2E] tabular-nums">
            {formatarNumero(funil.novasAgencias)}
          </p>
          <p className="text-xs text-[#8888AA]">{funil.novasAgenciasPct}</p>
        </div>

        <FunilColuna
          label="Nunca compraram"
          valor={funil.nuncaCompraram}
          valorCor="#EF4444"
          sublabel={funil.nuncaCompraramPct}
          ativo={filtro === "nunca"}
          onClick={() => onFiltrar("nunca")}
        />
        <FunilColuna
          label="Comprando"
          valor={funil.comprando}
          valorCor="#16A34A"
          sublabel={funil.comprandoPct}
          ativo={filtro === "comprando"}
          onClick={() => onFiltrar("comprando")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-[#F2F2F8]">
          <span className="block h-full" style={{ width: "21.3%", background: "#10B981" }} />
          <span
            className="block h-full"
            style={{ width: "78.7%", background: "rgba(239,68,68,0.35)" }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-[#8888AA]">
          <span>{formatarNumero(funil.comprando)} já compraram</span>
          <span>{formatarNumero(funil.nuncaCompraram)} aguardando 1ª compra</span>
        </div>
      </div>
    </div>
  );
}

function FunilColuna({
  label,
  valor,
  valorCor,
  sublabel,
  ativo,
  onClick,
}: {
  label: string;
  valor: number;
  valorCor: string;
  sublabel: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-l border-[#F0F0F6] pl-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium tracking-[0.03em] text-[#3A3A55] uppercase">
          {label}
        </p>
        <button
          type="button"
          title="Filtrar a lista de agências"
          onClick={onClick}
          className={cn(
            "flex size-[26px] shrink-0 items-center justify-center rounded-lg border transition-colors duration-150 active:scale-95",
            ativo
              ? "border-[rgba(233,30,140,0.35)] bg-[rgba(233,30,140,0.10)]"
              : "border-[#E2E2EE] bg-white hover:bg-[#F6F4FA]",
          )}
        >
          <ArrowUpRight
            className={cn("size-[13px]", ativo ? "text-[#C2185B]" : "text-[#8A8AA3]")}
          />
        </button>
      </div>
      <p
        className="text-[34px] leading-none font-bold tracking-[-0.02em] tabular-nums"
        style={{ color: valorCor }}
      >
        {formatarNumero(valor)}
      </p>
      <p className="text-xs text-[#8888AA]">{sublabel}</p>
    </div>
  );
}
