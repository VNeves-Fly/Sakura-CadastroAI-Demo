"use client";

import { useState } from "react";
import { Bus, Globe2, Plane } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  AgenciaCategoriaVendasModal,
  type CategoriaVenda,
} from "@/modules/agencias-crm/components/detalhe/agencia-categoria-vendas-modal";
import {
  COR_AEREO_INTERNACIONAL,
  COR_AEREO_NACIONAL,
  COR_TERRESTRE,
} from "@/modules/agencias-crm/constants/agencia-dashboard.constants";
import { formatarMoedaAbreviada } from "@/modules/agencias-crm/utils/formatar-moeda.util";
import type { AgenciaDetalheVendas } from "@/modules/agencias-crm/types/agencia-detalhe.types";

interface AgenciaVendasVisaoGeralProps {
  vendas: AgenciaDetalheVendas;
}

function KpiCard({
  label,
  valor,
  sublinha,
}: {
  label: string;
  valor: React.ReactNode;
  sublinha?: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground mt-1 text-lg font-bold tabular-nums">{valor}</p>
      {sublinha ? <p className="text-muted-foreground mt-0.5 text-xs">{sublinha}</p> : null}
    </div>
  );
}

// Card clicável de categoria (Aéreo Nacional/Internacional/Terrestre) — ao
// clicar abre AgenciaCategoriaVendasModal com o detalhe daquela categoria
// (pedido do usuário 2026-08-19, substitui os blocos "Mix Aéreo ×
// Terrestre" e "Resumo Comparativo" removidos).
function CategoriaCard({
  icon: Icon,
  cor,
  label,
  valor,
  sublinha,
  onClick,
}: {
  icon: typeof Plane;
  cor: string;
  label: string;
  valor: React.ReactNode;
  sublinha: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border bg-card hover:border-primary/40 flex flex-col rounded-xl border p-4 text-left transition hover:shadow-sm"
    >
      <span className="-mx-4 -mt-4 mb-3 h-1 rounded-t-xl" style={{ backgroundColor: cor }} />
      <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
        <Icon className="size-3.5" style={{ color: cor }} />
        {label}
      </p>
      <p className="text-foreground mt-1 text-lg font-bold tabular-nums">{valor}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{sublinha}</p>
    </button>
  );
}

// Sub-aba "Visão Geral" de Vendas (SPEC seção 4.4) — todo o bloco de
// vendas é mock determinístico (ver agencia-detalhe.adapter.ts), não
// existe reserva/bilhete/limite de crédito real modelado no domínio hoje.
export function AgenciaVendasVisaoGeral({ vendas }: AgenciaVendasVisaoGeralProps) {
  const [categoriaAberta, setCategoriaAberta] = useState<CategoriaVenda | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CategoriaCard
          icon={Plane}
          cor={COR_AEREO_NACIONAL}
          label="Aéreo Nacional"
          valor={<SensitiveValue value={formatarMoedaAbreviada(vendas.aereoNacional.volume)} />}
          sublinha={`${vendas.aereoNacional.bilhetes} bilhetes · ${vendas.aereoNacional.pctAereo}% do aéreo`}
          onClick={() => setCategoriaAberta("nacional")}
        />
        <CategoriaCard
          icon={Globe2}
          cor={COR_AEREO_INTERNACIONAL}
          label="Aéreo Internacional"
          valor={
            <SensitiveValue value={formatarMoedaAbreviada(vendas.aereoInternacional.volume)} />
          }
          sublinha={`${vendas.aereoInternacional.bilhetes} bilhetes · ${vendas.aereoInternacional.pctAereo}% do aéreo`}
          onClick={() => setCategoriaAberta("internacional")}
        />
        <CategoriaCard
          icon={Bus}
          cor={COR_TERRESTRE}
          label="Terrestre"
          valor={<SensitiveValue value={formatarMoedaAbreviada(vendas.terrestre.volume)} />}
          sublinha={`${vendas.terrestre.servicos} serviços · ${vendas.terrestre.pctMix}% do mix`}
          onClick={() => setCategoriaAberta("terrestre")}
        />
        <KpiCard
          label="Volume Total"
          valor={<SensitiveValue value={formatarMoedaAbreviada(vendas.volumeTotalAno)} />}
          sublinha="ano"
        />
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <Plane className="text-primary size-4" />
          Top Companhias Aéreas
        </h3>
        <p className="text-muted-foreground text-xs">por volume faturado</p>
        {vendas.topCompanhias.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">Sem dados de companhias.</p>
        ) : (
          <ol className="divide-border mt-3 flex max-h-72 flex-col divide-y overflow-y-auto">
            {vendas.topCompanhias.map((cia, indice) => (
              <li key={cia.nome} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-foreground truncate">
                  <span className="text-muted-foreground mr-2 tabular-nums">{indice + 1}º</span>
                  {cia.nome}
                </span>
                <span className="text-foreground shrink-0 font-medium tabular-nums">
                  <SensitiveValue value={formatarMoedaAbreviada(cia.volume)} />
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <AgenciaCategoriaVendasModal
        categoria={categoriaAberta}
        vendas={vendas}
        onOpenChange={(open) => setCategoriaAberta(open ? categoriaAberta : null)}
      />
    </div>
  );
}
