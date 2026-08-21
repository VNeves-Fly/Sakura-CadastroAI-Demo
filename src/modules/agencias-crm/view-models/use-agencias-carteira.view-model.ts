"use client";

import { useMemo, useState } from "react";
import type {
  AgenciaCarteiraView,
  StatusTab,
} from "@/modules/agencias-crm/types/agencia-carteira.types";
import { TAMANHO_PAGINA_AGENCIAS_PADRAO } from "@/modules/agencias-crm/types/agencia-carteira.types";

// Atalho textual da busca (SPEC seção 2.3) — só "críticos" tem dado mock
// pra se apoiar hoje (paradas +90d); o resto do texto é busca literal
// normal (razão social/CNPJ/executivo).
const ATALHO_CRITICOS = "críticos";

export type TopVendas = "vendasAno" | "vendasMes";

// View-model simplificado pra SPEC_AGENCIAS_SAKURA (pixel, 2026-08-21) —
// a SPEC nova não prevê painel de filtros avançados nem ordenação por
// coluna (headers viram indicadores estáticos, ver agencias-carteira-
// tabela.tsx), só busca + 2 abas de status + toggle "Top vendas" Ano/Mês.
// Paginação foi mantida por pedido explícito do usuário (556+ agências
// reais não cabem numa única renderização), com tamanho de página
// configurável (AgenciasPaginacao).
export function useAgenciasCarteiraViewModel(agencias: AgenciaCarteiraView[]) {
  const [statusTab, setStatusTab] = useState<StatusTab>("ativas");
  const [busca, setBusca] = useState("");
  const [topVendas, setTopVendas] = useState<TopVendas>("vendasAno");
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPaginaState] = useState(TAMANHO_PAGINA_AGENCIAS_PADRAO);

  // Trocar o tamanho da página sempre volta pra página 1 — a página
  // atual pode não existir mais no novo tamanho (ex.: pág. 5 de 20 itens
  // não existe se o tamanho virar 250).
  function setTamanhoPagina(tamanho: number) {
    setTamanhoPaginaState(tamanho);
    setPagina(1);
  }

  function mudarStatusTab(valor: StatusTab) {
    setStatusTab(valor);
    setPagina(1);
  }

  function atualizarBusca(valor: string) {
    setBusca(valor);
    setPagina(1);
  }

  function mudarTopVendas(valor: TopVendas) {
    setTopVendas(valor);
    setPagina(1);
  }

  const contadores = useMemo(
    () => ({
      ativas: agencias.filter((agencia) => agencia.status === "ativo").length,
      inativas: agencias.filter((agencia) => agencia.reprovadaOuInativa).length,
    }),
    [agencias],
  );

  const agenciasFiltradas = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    const buscaCriticos = buscaNormalizada === ATALHO_CRITICOS;
    const buscaLiteral = buscaCriticos ? "" : buscaNormalizada;

    const filtradas = agencias.filter((agencia) => {
      if (statusTab === "ativas" && agencia.status !== "ativo") return false;
      if (statusTab === "inativas" && !agencia.reprovadaOuInativa) return false;
      if (buscaCriticos && agencia.diasSemComprar <= 90) return false;
      if (
        buscaLiteral &&
        !agencia.razaoSocial.toLowerCase().includes(buscaLiteral) &&
        !agencia.cnpj.includes(buscaLiteral) &&
        !(agencia.executivoNome ?? "").toLowerCase().includes(buscaLiteral)
      ) {
        return false;
      }
      return true;
    });

    return [...filtradas].sort((a, b) => b[topVendas] - a[topVendas]);
  }, [agencias, statusTab, busca, topVendas]);

  const totalPaginas = Math.max(1, Math.ceil(agenciasFiltradas.length / tamanhoPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const agenciasDaPagina = agenciasFiltradas.slice(
    (paginaAtual - 1) * tamanhoPagina,
    paginaAtual * tamanhoPagina,
  );

  return {
    statusTab,
    mudarStatusTab,
    contadores,
    busca,
    atualizarBusca,
    topVendas,
    mudarTopVendas,
    agencias: agenciasDaPagina,
    total: agenciasFiltradas.length,
    pagina: paginaAtual,
    totalPaginas,
    setPagina,
    tamanhoPagina,
    setTamanhoPagina,
  };
}
