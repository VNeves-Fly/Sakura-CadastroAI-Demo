import type { LucideIcon } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  formatarMoedaCompleta,
  formatarPercentual,
} from "@/modules/gestores/utils/formatar-moeda.util";
import { MargemRentabBlocoGestor } from "@/modules/gestores/components/dashboard/margem-rentab-bloco-gestor";
import { cn } from "@/lib/utils";
import type { CanalMargemPeriodoGestor } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorCanalResumoCardProps {
  canal: CanalMargemPeriodoGestor;
  titulo: string;
  unidade: string;
  icon: LucideIcon;
  tema: "rosa" | "azul";
}

// Cartão de canal (Aéreo/Terrestre) dentro do card de receita total (SPEC
// 3.6) — mesmo componente/lógica de CanalResumoCard em
// atribuicoes/components/executivo/dashboard (duplicado por isolamento de
// módulo). `canal.valor`/`canal.quantidade` já vêm reais (soma agregada
// dos executivos subordinados — ver somarMargemRentab em
// agregacoes-gestor.util.ts), sem derivação de participação/ticket médio.
export function GestorCanalResumoCard({
  canal,
  titulo,
  unidade,
  icon: Icon,
  tema,
}: GestorCanalResumoCardProps) {
  return (
    <div className="border-border rounded-xl border p-4">
      <div className="flex gap-4">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
            tema === "rosa" ? "bg-primary/10 text-primary" : "bg-info/10 text-info",
          )}
        >
          <Icon className="size-4.5" />
        </span>

        <div className="flex min-w-0 flex-col gap-0.5">
          <p
            className={cn(
              "text-[11px] font-extrabold tracking-[0.1em] uppercase",
              tema === "rosa" ? "text-primary" : "text-info",
            )}
          >
            {titulo}
          </p>

          <div className="flex flex-wrap items-center gap-3.5">
            <p className="text-foreground text-[22px] leading-tight font-extrabold tracking-tight">
              <SensitiveValue value={formatarMoedaCompleta(canal.valor)} />
            </p>

            <MargemRentabBlocoGestor
              margemLabel="MARGEM"
              margemPct={canal.margemPct}
              margemLYPct={canal.margemLYPct}
              margemVariacaoPct={canal.margemVariacaoPct}
              rentabLYValor={canal.rentabLYValor}
              rentabLYVariacaoPct={canal.rentabLYVariacaoPct}
              tamanho="pequeno"
            />
          </div>

          <p className="text-muted-foreground mt-0.5 text-[13px]">
            <SensitiveValue value={canal.quantidade} /> {unidade}
          </p>
          <p className="text-muted-foreground text-[13px]">
            Ticket médio: <SensitiveValue value={formatarMoedaCompleta(canal.ticketMedio)} />
          </p>
        </div>
      </div>

      {canal.valor > 0 ? (
        <div className="mt-3.5 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-primary text-[11px] font-bold">NAC</span>
            <span className="flex h-[5px] flex-1 overflow-hidden rounded-full">
              <span className="bg-primary block h-full" style={{ width: `${canal.nacPct}%` }} />
              <span className="bg-info block h-full" style={{ width: `${canal.intPct}%` }} />
            </span>
            <span className="text-info text-[11px] font-bold">INT</span>
          </div>
          <div className="flex justify-between">
            <span className="bg-primary/10 text-primary rounded-md px-2.5 py-1 text-[11.5px] font-bold">
              {formatarPercentual(canal.nacPct)}
            </span>
            <span className="bg-info/10 text-info rounded-md px-2.5 py-1 text-[11.5px] font-bold">
              {formatarPercentual(canal.intPct)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
