"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePromotoresCrudStore } from "@/modules/atribuicoes/stores/promotores-crud.store";
import { promotoresCrudAdapter } from "@/modules/atribuicoes/adapters/promotores-crud.adapter";
import { promotoresCrudService } from "@/modules/atribuicoes/services/promotores-crud.service";
import type { PromotorCrudView } from "@/modules/atribuicoes/types/promotor-crud.types";

// `initialExecutivos` vem de PromotoresListaSecao (SSR, já com vendas
// reais mescladas via calcularVendasPorExecutivos — ver
// promotores-lista-secao.tsx) — quando presente, semeia a store direto e
// pula o fetch client no mount, evitando repetir o fan-out de SST que já
// rodou no servidor. Sem isso, cai no fetch client de sempre (usado hoje
// por qualquer consumidor que não passe dado inicial).
//
// A semeadura só pode rodar dentro de um `useEffect` (client-only) — a
// store é um singleton de módulo compartilhado entre requisições
// concorrentes no processo Node do Cloud Run; escrever nela durante o
// render (inclusive SSR) arriscaria vazar dado de um usuário pra outro.
// Isso cria uma janela entre o HTML gerado no servidor (store ainda vazia)
// e o efeito rodando no client — pra essa janela não aparecer como "nenhum
// executivo encontrado", `hydrated` (estado local, seguro por instância de
// componente) força `isLoading` até a semeadura acontecer.
export function usePromotoresListViewModel(initialExecutivos?: PromotorCrudView[]) {
  const promotores = usePromotoresCrudStore((state) => state.promotores);
  const storeIsLoading = usePromotoresCrudStore((state) => state.isLoading);
  const error = usePromotoresCrudStore((state) => state.error);
  const setPromotores = usePromotoresCrudStore((state) => state.setPromotores);
  const setLoading = usePromotoresCrudStore((state) => state.setLoading);
  const setError = usePromotoresCrudStore((state) => state.setError);

  const loadPromotores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const raw = await promotoresCrudService.list();
      setPromotores(promotoresCrudAdapter.toViewList(raw));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setPromotores]);

  const [hydrated, setHydrated] = useState(false);
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;

    if (initialExecutivos) {
      setPromotores(initialExecutivos);
      setHydrated(true);
      return;
    }
    void loadPromotores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = initialExecutivos ? !hydrated : storeIsLoading;

  return { promotores, isLoading, error, reload: loadPromotores };
}
