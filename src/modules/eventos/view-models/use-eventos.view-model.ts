"use client";

import { useCallback, useEffect, useState } from "react";
import type { Evento, CriarEventoInput } from "@/modules/eventos/types/evento.types";
import { eventosApi } from "@/modules/eventos/services/eventos-api";

export function useEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  const [hasError, setHasError] = useState(false);

  const carregarEventos = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const eventosCarregados = await eventosApi.listarEventos();
      setEventos(eventosCarregados);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarEventos();
  }, [carregarEventos]);

  const criarEvento = useCallback(
    async (input: CriarEventoInput) => {
      setIsSalvando(true);
      try {
        await eventosApi.criarEvento(input);
        await carregarEventos();
      } finally {
        setIsSalvando(false);
      }
    },
    [carregarEventos],
  );

  return {
    eventos,
    isLoading,
    isSalvando,
    hasError,
    criarEvento,
  };
}
