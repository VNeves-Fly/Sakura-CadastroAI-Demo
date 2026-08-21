import type { LucideIcon } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  formatarMoedaCompleta,
  formatarPercentual,
} from "@/modules/agencias-crm/utils/formatar-moeda.util";
import { AgenciaMargemRentabBloco } from "@/modules/agencias-crm/components/detalhe/agencia-margem-rentab-bloco";
import type { CanalMargem } from "@/modules/agencias-crm/types/agencia-detalhe.types";
import { cn } from "@/lib/utils";

interface AgenciaCanalResumoCardProps {
  titulo: string;
  icon: LucideIcon;
  tema: "rosa" | "azul";
  volume: number; // real
  quantidade: number; // real — bilhetes (aéreo) ou serviços (terrestre)
  unidade: string;
  ticketMedio: number; // real
  nacPct: number; // real (aéreo: % de bilhetes; terrestre: % de vendas por `nac_int`)
  intPct: number; // real, mesma origem de nacPct
  margem: CanalMargem; // real via SST (agencia-detalhe.adapter.ts) — mock por hash como fallback
}

// Sub-card de canal (Aéreo/Terrestre) dentro do card "Volume total" (SPEC
// 3.5.A) — volume/quantidade/ticket médio/NAC-INT/margem vêm do adapter
// real (agencia-detalhe.adapter.ts) quando a agência tem venda detectada
// — mock por hash como fallback, mesmo critério do resto do módulo. Sem
// venda no canal (volume 0), a barra NAC/INT não aparece — não tem
// proporção real pra mostrar (pedido do usuário, 2026-08-21).
export function AgenciaCanalResumoCard({
  titulo,
  icon: Icon,
  tema,
  volume,
  quantidade,
  unidade,
  ticketMedio,
  nacPct,
  intPct,
  margem,
}: AgenciaCanalResumoCardProps) {
  return (
    <div className="border-border flex-1 rounded-[10px] border p-4" style={{ flexBasis: 260 }}>
      <p
        className={cn(
          "flex items-center gap-1.5 text-[11.5px] font-bold tracking-wide uppercase",
          tema === "rosa" ? "text-primary" : "text-info",
        )}
      >
        <Icon className="size-3.5" />
        {titulo}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-3.5">
        <p className="text-foreground text-[23px] leading-tight font-bold tracking-tight">
          <SensitiveValue value={formatarMoedaCompleta(volume)} />
        </p>
        <AgenciaMargemRentabBloco
          margemLabel="MARGEM"
          margemPct={margem.margemPct}
          margemLYPct={margem.margemLYPct}
          margemVariacaoPct={margem.margemVariacaoPct}
          rentabLYValor={margem.rentabLYValor}
          rentabLYVariacaoPct={margem.rentabLYVariacaoPct}
          tamanho="pequeno"
        />
      </div>

      <p className="text-muted-foreground mt-1.5 text-xs">
        <SensitiveValue value={quantidade} /> {unidade} · Ticket médio:{" "}
        <SensitiveValue value={formatarMoedaCompleta(ticketMedio)} />
      </p>

      {volume > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[10.5px] font-bold text-[#9494AC]">NAC</span>
            <span className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-[#F4F4F9]">
              <span className="bg-primary block h-full" style={{ width: `${nacPct}%` }} />
              <span className="bg-info block h-full" style={{ width: `${intPct}%` }} />
            </span>
            <span className="text-[10.5px] font-bold text-[#9494AC]">INT</span>
          </div>
          <div className="flex justify-between">
            <span className="rounded-md bg-[#FDEBF4] px-2.5 py-1 text-[11.5px] font-bold text-[#C2185B]">
              {formatarPercentual(nacPct, 0)}
            </span>
            <span className="rounded-md bg-[#E3E6F5] px-2.5 py-1 text-[11.5px] font-bold text-[#2563EB]">
              {formatarPercentual(intPct, 0)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
