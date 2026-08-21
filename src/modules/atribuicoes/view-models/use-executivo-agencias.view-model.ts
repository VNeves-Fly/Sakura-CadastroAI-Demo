"use client";

import { useMemo, useState } from "react";
import {
  montarAgenciasCarteiraViewList,
  valorNoPeriodo,
} from "@/modules/atribuicoes/adapters/executivo-agencias.adapter";
import type { AgenciaCarteiraResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";
import type {
  AgenciaCarteiraView,
  AgenciasCarteiraFiltros,
} from "@/modules/atribuicoes/types/executivo-agencias.types";

const FILTROS_INICIAIS: AgenciasCarteiraFiltros = {
  busca: "",
  canalVendas: "todos",
  ultimaCompra: "qualquer",
  ordenarPor: "vendasAno",
  periodo: "mes",
  apenasComprando: false,
};

// Rank numérico da faixa de recência — maior = mais tempo sem comprar.
// Só usado pra ordenação (`ordenarPor: "ultimaCompra"`), já que
// `faixaRecencia` não é mais um número de dias exato (ver
// executivo-agencias.types.ts).
const RANK_RECENCIA: Record<AgenciaCarteiraView["faixaRecencia"], number> = {
  ate30d: 1,
  "30a90d": 2,
  "90a365d": 3,
  semVenda365d: 4,
};

function valorDeOrdenacao(agencia: AgenciaCarteiraView, filtros: AgenciasCarteiraFiltros): number {
  switch (filtros.ordenarPor) {
    case "vendasPeriodo":
      return valorNoPeriodo(agencia, filtros.periodo).vendas;
    case "ticketMedio":
      return valorNoPeriodo(agencia, filtros.periodo).ticketMedio;
    case "ultimaCompra":
      return RANK_RECENCIA[agencia.faixaRecencia];
    case "vendasAno":
    default:
      return agencia.vendasAno;
  }
}

export function useExecutivoAgenciasViewModel(agenciasCarteira: AgenciaCarteiraResumo[]) {
  const [filtros, setFiltros] = useState<AgenciasCarteiraFiltros>(FILTROS_INICIAIS);

  const agencias = useMemo(
    () => montarAgenciasCarteiraViewList(agenciasCarteira),
    [agenciasCarteira],
  );

  const agenciasFiltradas = useMemo(() => {
    const buscaNormalizada = filtros.busca.trim().toLowerCase();

    const filtradas = agencias.filter((agencia) => {
      if (filtros.canalVendas !== "todos" && agencia.canal !== filtros.canalVendas) return false;
      if (filtros.ultimaCompra === "ate30" && agencia.faixaRecencia !== "ate30d") return false;
      if (filtros.ultimaCompra === "30a90" && agencia.faixaRecencia !== "30a90d") return false;
      if (
        filtros.ultimaCompra === "mais90" &&
        agencia.faixaRecencia !== "90a365d" &&
        agencia.faixaRecencia !== "semVenda365d"
      ) {
        return false;
      }
      if (filtros.apenasComprando && valorNoPeriodo(agencia, filtros.periodo).vendas <= 0) {
        return false;
      }
      if (buscaNormalizada && !agencia.nome.toLowerCase().includes(buscaNormalizada)) return false;
      return true;
    });

    return [...filtradas].sort(
      (a, b) => valorDeOrdenacao(b, filtros) - valorDeOrdenacao(a, filtros),
    );
  }, [agencias, filtros]);

  function atualizarFiltro<K extends keyof AgenciasCarteiraFiltros>(
    chave: K,
    valor: AgenciasCarteiraFiltros[K],
  ) {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
  }

  return {
    filtros,
    atualizarFiltro,
    agencias: agenciasFiltradas,
    total: agenciasFiltradas.length,
  };
}
