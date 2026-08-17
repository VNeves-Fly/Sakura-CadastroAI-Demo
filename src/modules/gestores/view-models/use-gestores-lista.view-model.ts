"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useGestoresListViewModel } from "@/modules/gestores/view-models/use-gestores-list.view-model";
import { useGestorNiveisStore } from "@/modules/gestores/stores/gestor-niveis.store";
import { gestorListaAdapter } from "@/modules/gestores/adapters/gestor-lista.adapter";
import type { GestorListaFiltros } from "@/modules/gestores/types/gestor-lista.types";

const FILTROS_INICIAIS: GestorListaFiltros = { busca: "" };

// Simula o tempo de resposta de um endpoint de indicadores — não existe um
// real hoje (ver gestor-lista.adapter.ts), isso é só pra o botão
// "Visualizar dados" não trocar de "-" pro valor instantaneamente, o que
// pareceria bug em vez de carregamento.
const ATRASO_SIMULADO_MS = 500;

export function useGestoresListaViewModel(executivosPorGestor: Record<string, number>) {
  const { gestores, isLoading, error } = useGestoresListViewModel();
  const nivelOverrides = useGestorNiveisStore((state) => state.overrides);
  const [filtros, setFiltros] = useState<GestorListaFiltros>(FILTROS_INICIAIS);
  const [carregado, setCarregado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<number | null>(null);
  // Só existe pra forçar recálculo de "Atualizado há X min" com o tempo
  // passando — a tabela em si não depende deste valor.
  const [, forcarRecalculo] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => forcarRecalculo((atual) => atual + 1), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  const gestoresView = useMemo(
    () =>
      gestorListaAdapter.toListaViewList(gestores, executivosPorGestor, nivelOverrides, carregado),
    [gestores, executivosPorGestor, nivelOverrides, carregado],
  );

  const gestoresFiltrados = useMemo(() => {
    const buscaNormalizada = filtros.busca.trim().toLowerCase();
    if (!buscaNormalizada) return gestoresView;
    return gestoresView.filter((gestor) => gestor.nome.toLowerCase().includes(buscaNormalizada));
  }, [gestoresView, filtros]);

  const visualizarDados = useCallback(async () => {
    setCarregando(true);
    // Sem endpoint real hoje — atraso artificial só pra não parecer bug.
    await new Promise((resolve) => setTimeout(resolve, ATRASO_SIMULADO_MS));
    setCarregado(true);
    setUltimaAtualizacao(Date.now());
    setCarregando(false);
  }, []);

  const minutosDesdeAtualizacao =
    ultimaAtualizacao === null ? null : Math.floor((Date.now() - ultimaAtualizacao) / 60_000);

  return {
    gestores: gestoresFiltrados,
    total: gestoresFiltrados.length,
    isLoading,
    error,
    busca: filtros.busca,
    atualizarBusca: (valor: string) => setFiltros({ busca: valor }),
    carregado,
    carregando,
    minutosDesdeAtualizacao,
    visualizarDados,
  };
}
