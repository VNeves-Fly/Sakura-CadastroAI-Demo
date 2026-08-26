"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGestoresStore } from "@/modules/gestores/stores/gestores.store";
import { gestoresAdapter } from "@/modules/gestores/adapters/gestores.adapter";
import {
  gestoresService,
  type RawGestorResponse,
} from "@/modules/gestores/services/gestores.service";

// `initialGestores` vem do SSR (page.tsx, já buscado localmente via
// gestoresController.list()) — quando presente, semeia a store direto e
// pula o fetch client no mount, eliminando um `GET /api/gestores`
// redundante em toda navegação pra /crm/gestores.
//
// A semeadura só pode rodar dentro de um `useEffect` (client-only) — a
// store é um singleton de módulo compartilhado entre requisições
// concorrentes no processo Node do Cloud Run; escrever nela durante o
// render (inclusive SSR) arriscaria vazar dado de um usuário pra outro.
// Isso cria uma janela entre o HTML gerado no servidor (store ainda vazia)
// e o efeito rodando no client — pra essa janela não aparecer como "nenhum
// gestor encontrado", `hydrated` (estado local, seguro por instância de
// componente) força `isLoading` até a semeadura acontecer.
export function useGestoresListViewModel(initialGestores?: RawGestorResponse[]) {
  const gestores = useGestoresStore((state) => state.gestores);
  const storeIsLoading = useGestoresStore((state) => state.isLoading);
  const error = useGestoresStore((state) => state.error);
  const setGestores = useGestoresStore((state) => state.setGestores);
  const setLoading = useGestoresStore((state) => state.setLoading);
  const setError = useGestoresStore((state) => state.setError);

  const loadGestores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const raw = await gestoresService.list();
      setGestores(gestoresAdapter.toViewList(raw));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setGestores]);

  const [hydrated, setHydrated] = useState(false);
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;

    if (initialGestores) {
      setGestores(gestoresAdapter.toViewList(initialGestores));
      setHydrated(true);
      return;
    }
    void loadGestores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = initialGestores ? !hydrated : storeIsLoading;

  return { gestores, isLoading, error, reload: loadGestores };
}
