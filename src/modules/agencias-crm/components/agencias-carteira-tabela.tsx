"use client";

import { useRouter } from "next/navigation";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { formatarMoedaAbreviada } from "@/modules/agencias-crm/utils/formatar-moeda.util";
import { cn } from "@/lib/utils";
import type { AgenciaCarteiraView } from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasCarteiraTabelaProps {
  agencias: AgenciaCarteiraView[];
  offsetPagina: number;
}

// Grid de colunas idêntico no header e nas linhas: # | Agência | Código
// SICA | Base | Executivo | Vendas mês | Vendas ano. Coluna "Margem" da
// SPEC original removida (pedido do usuário, 2026-08-21) — não tem fonte
// real na carteira inteira (só o Aéreo por agência individual tem
// margem/rentabilidade no SST, e isso exigiria uma chamada por agência,
// ~21 mil chamadas; ver docs/crm-agencias-backend.md).
const COLS =
  "44px minmax(240px,1.3fr) 110px 90px minmax(160px,1.4fr) minmax(120px,1fr) minmax(130px,1fr)";

// Tabela principal da listagem de Agências (SPEC seção 2.5) — headers são
// indicadores estáticos (⇅/↓), sem ordenação por coluna real (a ordenação
// de fato vem do toggle "Top vendas" Ano/Mês da toolbar, ver
// use-agencias-carteira.view-model.ts). Clique em qualquer ponto da linha
// navega pra página de detalhe da agência.
export function AgenciasCarteiraTabela({ agencias, offsetPagina }: AgenciasCarteiraTabelaProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 1040 }}>
        <div
          className="grid border-t border-b border-[#F0F0F6] bg-[#FAFAFD] px-[22px] py-3 text-[11px] font-bold tracking-[0.06em] text-[#8888AA] uppercase"
          style={{ gridTemplateColumns: COLS }}
        >
          <span>#</span>
          <span>Agência ⇅</span>
          <span>Código SICA</span>
          <span className="text-center">Base</span>
          <span className="text-center">Executivo</span>
          <span className="text-right">Vendas mês ⇅</span>
          <span className="text-primary text-right">Vendas ano ↓</span>
        </div>

        {agencias.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Nenhuma agência encontrada com esses filtros.
          </p>
        ) : (
          agencias.map((agencia, indice) => {
            return (
              <div
                key={agencia.id}
                // `agencia.id` (= String(codigoEmpresa)), não `cnpj` — a
                // página de detalhe (/crm/agencias/[id]) resolve pelo
                // código SICA direto no SST (GET /api/reports/
                // base-empresa-cadastro?codigoEmpresa=X), que não aceita
                // filtro por CNPJ (confirmado por curl real, 2026-08-21).
                onClick={() => router.push(`/crm/agencias/${agencia.id}`)}
                className="group grid cursor-pointer items-center border-b border-[#F4F4F9] px-[22px] py-3 text-[13px] text-[#3A3A55] transition-colors duration-150 hover:bg-[#FCFAFD]"
                style={{ gridTemplateColumns: COLS }}
              >
                <span className="text-[12.5px] text-[#9494AC] tabular-nums">
                  {offsetPagina + indice + 1}
                </span>
                <p className="text-primary truncate pr-2.5 text-[13px] font-bold tracking-[0.01em] group-hover:underline">
                  {agencia.razaoSocial}
                </p>
                <span className="text-[12.5px] text-[#6B6B85] tabular-nums">
                  {agencia.sica ?? "—"}
                </span>
                <span className="truncate text-center text-[13px] text-[#B4B4C8]">
                  {agencia.base ?? "—"}
                </span>
                <span
                  className={cn(
                    "truncate text-center text-[12.5px] font-medium tracking-[0.02em] uppercase",
                    agencia.executivoNome ? "text-[#6B6B85]" : "text-[#D97706]",
                  )}
                >
                  {agencia.executivoNome ?? "não definido"}
                </span>
                <span className="text-right tabular-nums">
                  <SensitiveValue
                    value={agencia.vendasMes > 0 ? formatarMoedaAbreviada(agencia.vendasMes) : "—"}
                  />
                </span>
                <span className="text-primary text-right font-semibold tabular-nums">
                  <SensitiveValue
                    value={agencia.vendasAno > 0 ? formatarMoedaAbreviada(agencia.vendasAno) : "—"}
                  />
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
