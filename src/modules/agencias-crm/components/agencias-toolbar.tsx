"use client";

import { BuscaListaInput } from "@/modules/shared/components/busca-lista-input";

interface AgenciasToolbarProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  atualizadoEm: string;
}

// Barra de controle superior da listagem (SPEC_AGENCIAS_SAKURA seções 2.2
// e 2.3) — "Financial Adapter — Atualizado em..." é texto informativo
// estático (não existe fonte de "última sincronização" real pra essa
// listagem hoje). Painel de filtros avançados removido nessa reestilização
// (pedido do usuário, 2026-08-21) — a SPEC nova só prevê busca. Toggle
// "Top vendas" Ano/Mês removido (pedido do usuário, 2026-08-27) junto com
// as colunas de vendas na tabela, ver use-agencias-carteira.view-model.ts.
export function AgenciasToolbar({ busca, onBuscaChange, atualizadoEm }: AgenciasToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#8888AA]">Financial Adapter — Atualizado em {atualizadoEm}</p>

      <BuscaListaInput
        value={busca}
        onChange={onBuscaChange}
        placeholder="Buscar CNPJ, razão social, executivo..."
        className="max-w-none"
      />
    </div>
  );
}
