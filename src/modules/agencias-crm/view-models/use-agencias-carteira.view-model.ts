"use client";

import { useMemo, useState } from "react";
import type {
  AgenciaCarteiraView,
  AgenciasCarteiraFiltros,
  OpcaoFiltro,
  StatusTab,
} from "@/modules/agencias-crm/types/agencia-carteira.types";
import { TAMANHO_PAGINA_AGENCIAS_PADRAO } from "@/modules/agencias-crm/types/agencia-carteira.types";

const FILTROS_INICIAIS: AgenciasCarteiraFiltros = {
  busca: "",
  regiao: "todas",
  base: "todas",
  executivoId: "todos",
  gestorNome: "todos",
  situacaoReceita: "todas",
  dadosFaltantes: "todos",
  canalVendas: "todos",
  premiacao: "todas",
  ultimaCompra: "qualquer",
  ordenarPor: "vendasAno",
  ordenarDirecao: "desc",
  ocultarInativadas: true,
};

// Atalhos textuais da busca (SPEC seção 3.4) — só "críticos" tem dado mock
// pra se apoiar hoje (paradas +90d); "baixado"/"inapto"/"cnae" ficam como
// termo de busca literal normal (não têm fonte real na listagem ainda —
// ver agencia-carteira.adapter.ts) até a Situação Receita ser resolvida em
// lote.
const ATALHO_CRITICOS = "críticos";

function valorDeOrdenacao(
  agencia: AgenciaCarteiraView,
  ordenarPor: AgenciasCarteiraFiltros["ordenarPor"],
): number | string {
  switch (ordenarPor) {
    case "vendasMes":
      return agencia.vendasMes;
    case "razaoSocial":
      return agencia.razaoSocial;
    case "createdAt":
      return agencia.createdAt;
    case "ultimaCompra":
      return agencia.diasSemComprar;
    case "bilhetes":
      return agencia.bilhetes;
    case "limite":
      return agencia.limite;
    case "vendasAno":
    default:
      return agencia.vendasAno;
  }
}

export function useAgenciasCarteiraViewModel(agencias: AgenciaCarteiraView[]) {
  const [statusTab, setStatusTab] = useState<StatusTab>("todas");
  const [filtros, setFiltros] = useState<AgenciasCarteiraFiltros>(FILTROS_INICIAIS);
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPaginaState] = useState(TAMANHO_PAGINA_AGENCIAS_PADRAO);

  // Trocar o tamanho da página sempre volta pra página 1 — a página
  // atual pode não existir mais no novo tamanho (ex.: pág. 5 de 20 itens
  // não existe se o tamanho virar 250).
  function setTamanhoPagina(tamanho: number) {
    setTamanhoPaginaState(tamanho);
    setPagina(1);
  }

  function atualizarFiltro<K extends keyof AgenciasCarteiraFiltros>(
    chave: K,
    valor: AgenciasCarteiraFiltros[K],
  ) {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
    setPagina(1);
  }

  function limparFiltros() {
    setFiltros(FILTROS_INICIAIS);
    setPagina(1);
  }

  function mudarStatusTab(valor: StatusTab) {
    setStatusTab(valor);
    setPagina(1);
  }

  const contadores = useMemo(
    () => ({
      todas: agencias.length,
      aprovadas: agencias.filter((agencia) => agencia.status === "ativo").length,
      reprovadas_inativas: agencias.filter((agencia) => agencia.reprovadaOuInativa).length,
    }),
    [agencias],
  );

  const opcoesExecutivo: OpcaoFiltro[] = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const agencia of agencias) {
      if (agencia.executivoId && agencia.executivoNome) {
        mapa.set(agencia.executivoId, agencia.executivoNome);
      }
    }
    return [...mapa.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [agencias]);

  const opcoesGestor: OpcaoFiltro[] = useMemo(() => {
    const nomes = new Set(
      agencias.map((agencia) => agencia.gestorNome).filter(Boolean) as string[],
    );
    return [...nomes]
      .sort((a, b) => a.localeCompare(b))
      .map((nome) => ({ value: nome, label: nome }));
  }, [agencias]);

  const opcoesBase: OpcaoFiltro[] = useMemo(() => {
    const bases = new Set(agencias.map((agencia) => agencia.base).filter(Boolean) as string[]);
    return [...bases].sort().map((base) => ({ value: base, label: base }));
  }, [agencias]);

  const opcoesRegiao: OpcaoFiltro[] = useMemo(() => {
    const regioes = new Set(agencias.map((agencia) => agencia.regiao).filter(Boolean) as string[]);
    return [...regioes].sort().map((regiao) => ({ value: regiao, label: regiao }));
  }, [agencias]);

  const agenciasFiltradas = useMemo(() => {
    const buscaNormalizada = filtros.busca.trim().toLowerCase();
    const buscaCriticos = buscaNormalizada === ATALHO_CRITICOS;
    const buscaLiteral = buscaCriticos ? "" : buscaNormalizada;

    const filtradas = agencias.filter((agencia) => {
      if (statusTab === "aprovadas" && agencia.status !== "ativo") return false;
      if (statusTab === "reprovadas_inativas" && !agencia.reprovadaOuInativa) return false;
      if (
        filtros.ocultarInativadas &&
        statusTab !== "reprovadas_inativas" &&
        agencia.reprovadaOuInativa
      ) {
        return false;
      }
      if (filtros.regiao !== "todas" && agencia.regiao !== filtros.regiao) return false;
      if (filtros.base !== "todas" && agencia.base !== filtros.base) return false;
      if (filtros.executivoId !== "todos" && agencia.executivoId !== filtros.executivoId) {
        return false;
      }
      if (filtros.gestorNome !== "todos" && agencia.gestorNome !== filtros.gestorNome) return false;
      if (filtros.dadosFaltantes === "pendentes" && !agencia.dadosFaltantes) return false;
      if (filtros.canalVendas !== "todos" && agencia.canal !== filtros.canalVendas) return false;
      if (filtros.premiacao !== "todas" && agencia.categoria !== filtros.premiacao) return false;
      if (filtros.ultimaCompra === "ate30" && agencia.diasSemComprar > 30) return false;
      if (
        filtros.ultimaCompra === "30a90" &&
        (agencia.diasSemComprar <= 30 || agencia.diasSemComprar > 90)
      ) {
        return false;
      }
      if (filtros.ultimaCompra === "mais90" && agencia.diasSemComprar <= 90) return false;
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

    const sinal = filtros.ordenarDirecao === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      const valorA = valorDeOrdenacao(a, filtros.ordenarPor);
      const valorB = valorDeOrdenacao(b, filtros.ordenarPor);
      if (typeof valorA === "number" && typeof valorB === "number") {
        return (valorA - valorB) * sinal;
      }
      return String(valorA).localeCompare(String(valorB)) * sinal;
    });
  }, [agencias, statusTab, filtros]);

  // Clique em cabeçalho de coluna (SPEC 3.5) — mesma coluna alterna
  // asc/desc, coluna nova entra sempre em desc (maior primeiro).
  function alternarOrdenacao(coluna: AgenciasCarteiraFiltros["ordenarPor"]) {
    setFiltros((atual) => ({
      ...atual,
      ordenarPor: coluna,
      ordenarDirecao:
        atual.ordenarPor === coluna && atual.ordenarDirecao === "desc" ? "asc" : "desc",
    }));
  }

  const totalPaginas = Math.max(1, Math.ceil(agenciasFiltradas.length / tamanhoPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const agenciasDaPagina = agenciasFiltradas.slice(
    (paginaAtual - 1) * tamanhoPagina,
    paginaAtual * tamanhoPagina,
  );

  const quantidadeFiltrosAtivos = Object.entries(filtros).filter(([chave, valor]) => {
    if (chave === "busca") return false;
    if (chave === "ordenarPor") return valor !== FILTROS_INICIAIS.ordenarPor;
    if (chave === "ocultarInativadas") return valor !== FILTROS_INICIAIS.ocultarInativadas;
    return valor !== "todas" && valor !== "todos" && valor !== "qualquer";
  }).length;

  return {
    statusTab,
    mudarStatusTab,
    contadores,
    filtros,
    atualizarFiltro,
    alternarOrdenacao,
    limparFiltros,
    quantidadeFiltrosAtivos,
    painelFiltrosAberto,
    setPainelFiltrosAberto,
    opcoesExecutivo,
    opcoesGestor,
    opcoesBase,
    opcoesRegiao,
    agencias: agenciasDaPagina,
    total: agenciasFiltradas.length,
    pagina: paginaAtual,
    totalPaginas,
    setPagina,
    tamanhoPagina,
    setTamanhoPagina,
  };
}
