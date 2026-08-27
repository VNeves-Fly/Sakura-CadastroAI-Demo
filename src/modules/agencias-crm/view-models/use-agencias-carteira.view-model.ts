"use client";

import { useMemo, useState } from "react";
import type {
  AgenciaCarteiraView,
  StatusTab,
} from "@/modules/agencias-crm/types/agencia-carteira.types";
import { TAMANHO_PAGINA_AGENCIAS_PADRAO } from "@/modules/agencias-crm/types/agencia-carteira.types";

// View-model simplificado pra SPEC_AGENCIAS_SAKURA (pixel, 2026-08-21) —
// a SPEC nova não prevê painel de filtros avançados nem ordenação por
// coluna (headers viram indicadores estáticos, ver agencias-carteira-
// tabela.tsx), só busca + 2 abas de status, sem ordenação nenhuma (pedido
// do usuário, 2026-08-27 — nem alfabética; mantém a ordem do roster).
// Toggle "Top vendas" Ano/Mês e atalho de busca "críticos" removidos
// (pedido do usuário, 2026-08-27) — dependiam das métricas reais do SST
// (vendasAno/vendasMes/diasSemComprar), que deixaram de ser buscadas na
// listagem (ver agencia-carteira.loader.ts) pra cortar o carregamento a
// frio de ~53s. Paginação foi mantida por pedido explícito do usuário
// (556+ agências reais não cabem numa única renderização), com tamanho de
// página configurável (AgenciasPaginacao).
export function useAgenciasCarteiraViewModel(agencias: AgenciaCarteiraView[]) {
  const [statusTab, setStatusTab] = useState<StatusTab>("ativas");
  const [busca, setBusca] = useState("");
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

  const contadores = useMemo(
    () => ({
      ativas: agencias.filter((agencia) => agencia.status === "ativo").length,
      inativas: agencias.filter((agencia) => agencia.reprovadaOuInativa).length,
    }),
    [agencias],
  );

  const agenciasFiltradas = useMemo(() => {
    const buscaLiteral = busca.trim().toLowerCase();

    return agencias.filter((agencia) => {
      if (statusTab === "ativas" && agencia.status !== "ativo") return false;
      if (statusTab === "inativas" && !agencia.reprovadaOuInativa) return false;
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
  }, [agencias, statusTab, busca]);

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
    agencias: agenciasDaPagina,
    total: agenciasFiltradas.length,
    pagina: paginaAtual,
    totalPaginas,
    setPagina,
    tamanhoPagina,
    setTamanhoPagina,
  };
}
