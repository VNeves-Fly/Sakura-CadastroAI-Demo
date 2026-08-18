"use client";

import { useMemo, useState } from "react";
import type { FiltrosListaAgencias } from "@/modules/novas-agencias/components/filtro-lista-agencias";
import type { AgenciaNova } from "@/modules/novas-agencias/types/novas-agencias.types";

export const TAMANHO_PAGINA_NOVAS_AGENCIAS = 25;

const FILTROS_INICIAIS: FiltrosListaAgencias = {
  busca: "",
  situacao: "todas",
  executivo: "todos",
  gerente: "todos",
  credito: "todos",
  apenasCompraram: false,
};

function correspondeABusca(agencia: AgenciaNova, buscaNormalizada: string): boolean {
  if (!buscaNormalizada) return true;
  return (
    agencia.nome.toLowerCase().includes(buscaNormalizada) ||
    agencia.cnpj.includes(buscaNormalizada) ||
    agencia.erp.includes(buscaNormalizada)
  );
}

// Filtro + paginação da "Lista de agências" (SPEC 8.2/8.5) — tudo
// client-side sobre o array mock já em memória, mesmo padrão do resto do
// app pra esse volume de dado (ver use-agencias-carteira.view-model.ts).
export function useListaAgenciasViewModel(agencias: AgenciaNova[]) {
  const [filtros, setFiltros] = useState<FiltrosListaAgencias>(FILTROS_INICIAIS);
  const [pagina, setPagina] = useState(1);

  function atualizarFiltro<K extends keyof FiltrosListaAgencias>(
    chave: K,
    valor: FiltrosListaAgencias[K],
  ) {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
    setPagina(1);
  }

  const opcoesExecutivo = useMemo(
    () => Array.from(new Set(agencias.map((agencia) => agencia.executivo))).sort(),
    [agencias],
  );
  const opcoesGerente = useMemo(
    () => Array.from(new Set(agencias.map((agencia) => agencia.gerente))).sort(),
    [agencias],
  );

  const agenciasFiltradas = useMemo(() => {
    const buscaNormalizada = filtros.busca.trim().toLowerCase();

    return agencias.filter((agencia) => {
      if (!correspondeABusca(agencia, buscaNormalizada)) return false;
      if (filtros.situacao !== "todas" && agencia.situacao !== filtros.situacao) return false;
      if (filtros.executivo !== "todos" && agencia.executivo !== filtros.executivo) return false;
      if (filtros.gerente !== "todos" && agencia.gerente !== filtros.gerente) return false;
      if (filtros.credito === "com" && agencia.creditoValor <= 0) return false;
      if (filtros.credito === "sem" && agencia.creditoValor > 0) return false;
      if (filtros.apenasCompraram && agencia.primeiraCompra === null) return false;
      return true;
    });
  }, [agencias, filtros]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(agenciasFiltradas.length / TAMANHO_PAGINA_NOVAS_AGENCIAS),
  );
  const paginaValida = Math.min(pagina, totalPaginas);
  const agenciasDaPagina = useMemo(() => {
    const offset = (paginaValida - 1) * TAMANHO_PAGINA_NOVAS_AGENCIAS;
    return agenciasFiltradas.slice(offset, offset + TAMANHO_PAGINA_NOVAS_AGENCIAS);
  }, [agenciasFiltradas, paginaValida]);

  return {
    filtros,
    atualizarFiltro,
    opcoesExecutivo,
    opcoesGerente,
    agenciasFiltradas,
    agenciasDaPagina,
    pagina: paginaValida,
    totalPaginas,
    setPagina,
  };
}
