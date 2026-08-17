"use client";

import { useMemo, useState } from "react";
import {
  montarAgenciasCarteiraViewList,
  valorNoPeriodo,
} from "@/modules/atribuicoes/adapters/executivo-agencias.adapter";
import type { ExecutivoAgenciaResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";
import type {
  AgenciaCarteiraView,
  AgenciasCarteiraFiltros,
} from "@/modules/atribuicoes/types/executivo-agencias.types";

const FILTROS_INICIAIS: AgenciasCarteiraFiltros = {
  busca: "",
  dadosFaltantes: "todos",
  canalVendas: "todos",
  premiacao: "todas",
  ultimaCompra: "qualquer",
  ordenarPor: "vendasAno",
  inativadasSakura: "ocultar",
  periodo: "mes",
};

function valorDeOrdenacao(agencia: AgenciaCarteiraView, filtros: AgenciasCarteiraFiltros): number {
  switch (filtros.ordenarPor) {
    case "vendasPeriodo":
      return valorNoPeriodo(agencia, filtros.periodo).vendas;
    case "ticketMedio":
      return valorNoPeriodo(agencia, filtros.periodo).ticketMedio;
    case "ultimaCompra":
      return agencia.diasSemComprar;
    case "vendasAno":
    default:
      return agencia.vendasAno;
  }
}

export function useExecutivoAgenciasViewModel(agenciasReais: ExecutivoAgenciaResumo[]) {
  const [filtros, setFiltros] = useState<AgenciasCarteiraFiltros>(FILTROS_INICIAIS);

  const agencias = useMemo(() => montarAgenciasCarteiraViewList(agenciasReais), [agenciasReais]);

  const agenciasFiltradas = useMemo(() => {
    const buscaNormalizada = filtros.busca.trim().toLowerCase();

    const filtradas = agencias.filter((agencia) => {
      if (filtros.inativadasSakura === "ocultar" && agencia.inativada) return false;
      if (filtros.dadosFaltantes === "pendentes" && !agencia.dadosFaltantes) return false;
      if (filtros.premiacao !== "todas" && agencia.categoria !== filtros.premiacao) return false;
      if (filtros.ultimaCompra === "ate30" && agencia.diasSemComprar > 30) return false;
      if (
        filtros.ultimaCompra === "30a90" &&
        (agencia.diasSemComprar <= 30 || agencia.diasSemComprar > 90)
      ) {
        return false;
      }
      if (filtros.ultimaCompra === "mais90" && agencia.diasSemComprar <= 90) return false;
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
