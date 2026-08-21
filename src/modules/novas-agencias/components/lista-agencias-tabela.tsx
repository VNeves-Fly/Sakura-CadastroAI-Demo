"use client";

import Link from "next/link";
import { StatusBadge } from "@/modules/novas-agencias/components/status-badge";
import type { AgenciaNovaLinha } from "@/modules/novas-agencias/types/novas-agencias.types";

// Template de colunas (SPEC 8.4) — idêntico no header e nas linhas.
const COLS =
  "minmax(0,2.1fr) minmax(0,1.05fr) minmax(0,0.78fr) minmax(0,0.78fr) minmax(0,0.9fr) minmax(190px,1.4fr)";

// Nome da agência linka pra página própria da agência (/crm/agencias/[id],
// mesmo padrão de Executivo/Gestor/listagem de Agências, pedido do
// usuário, 2026-08-21) — mas as 12 linhas desta tela são 100%
// mock/fictícias (id, nome e CNPJ inventados pela SPEC, sem registro real
// no banco), então o link vai cair num "página não encontrada" pra
// qualquer linha. A ligação já fica pronta pro dia em que esta lista vier
// de agências reais (ver novas-agencias.mock-service.ts), sem precisar
// tocar aqui de novo.
export function ListaAgenciasTabela({ agencias }: { agencias: AgenciaNovaLinha[] }) {
  return (
    <div style={{ minWidth: 1020 }}>
      <div
        className="grid border-t border-b border-[#F0F0F6] bg-[#FAFAFD] px-[22px] py-3 text-[11px] font-bold tracking-[0.06em] text-[#8888AA] uppercase"
        style={{ gridTemplateColumns: COLS }}
      >
        <span>Agência</span>
        <span>Executivo / Gerente</span>
        <span>Entrada</span>
        <span>1ª compra</span>
        <span className="text-right">Volume total</span>
        <span className="text-right">Situação</span>
      </div>

      {agencias.map((agencia) => (
        <div
          key={agencia.id}
          className="grid items-center border-b border-[#F4F4F9] px-[22px] py-3 text-[13px] text-[#3A3A55] transition-colors duration-150 hover:bg-[#FCFAFD]"
          style={{ gridTemplateColumns: COLS }}
        >
          <div className="flex flex-col gap-0.5 pr-3">
            <Link
              href={`/crm/agencias/${agencia.id}`}
              className="text-primary text-left text-[13px] font-bold tracking-[0.01em] hover:underline"
            >
              {agencia.nome}
            </Link>
            <span className="text-[11px] text-[#9494AC]">{agencia.meta}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[12.5px] font-semibold">{agencia.executivo}</span>
            <span className="text-[11px] text-[#9494AC]">{agencia.gerente}</span>
          </div>
          <span className="text-[12.5px] tabular-nums">{agencia.entrada}</span>
          <span className="text-[12.5px] text-[#6B6B85] tabular-nums">
            {agencia.primeiraCompra}
          </span>
          <span className="text-right text-[12.5px] font-semibold tabular-nums">
            {agencia.volume}
          </span>
          <div className="flex justify-end">
            <StatusBadge situacao={agencia.situacao} />
          </div>
        </div>
      ))}
    </div>
  );
}
