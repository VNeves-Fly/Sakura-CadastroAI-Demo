"use client";

import { useMemo, useState } from "react";
import {
  montarAgenciasDaGestaoViewList,
  valorNoPeriodo,
} from "@/modules/gestores/adapters/gestor-agencias-tab.adapter";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import type {
  AgenciaDaGestaoView,
  AgenciasDaGestaoFiltros,
} from "@/modules/gestores/types/gestor-agencias-tab.types";

const FILTROS_INICIAIS: AgenciasDaGestaoFiltros = {
  busca: "",
  executivoId: "todos",
  dadosFaltantes: "todos",
  canalVendas: "todos",
  premiacao: "todas",
  ultimaCompra: "qualquer",
  ordenarPor: "vendasAno",
  inativadasSakura: "ocultar",
  periodo: "mes",
};

function valorDeOrdenacao(agencia: AgenciaDaGestaoView, filtros: AgenciasDaGestaoFiltros): number {
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

export function useGestorAgenciasTabViewModel(executivos: ExecutivoComCarteira[]) {
  const [filtros, setFiltros] = useState<AgenciasDaGestaoFiltros>(FILTROS_INICIAIS);

  const agencias = useMemo(() => montarAgenciasDaGestaoViewList(executivos), [executivos]);

  const opcoesExecutivo = useMemo(
    () => executivos.map((executivo) => ({ id: executivo.id, nome: executivo.nome })),
    [executivos],
  );

  const agenciasFiltradas = useMemo(() => {
    const buscaNormalizada = filtros.busca.trim().toLowerCase();

    const filtradas = agencias.filter((agencia) => {
      if (filtros.executivoId !== "todos" && agencia.executivoId !== filtros.executivoId) {
        return false;
      }
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

  function atualizarFiltro<K extends keyof AgenciasDaGestaoFiltros>(
    chave: K,
    valor: AgenciasDaGestaoFiltros[K],
  ) {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
  }

  return {
    filtros,
    atualizarFiltro,
    agencias: agenciasFiltradas,
    total: agenciasFiltradas.length,
    opcoesExecutivo,
  };
}
