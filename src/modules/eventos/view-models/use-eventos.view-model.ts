"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Evento,
  CriarEventoInput,
  CriarEventoLinkInput,
} from "@/modules/eventos/types/evento.types";
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

  const criarEventoLink = useCallback(
    async (input: CriarEventoLinkInput) => {
      setIsSalvando(true);
      try {
        await eventosApi.criarEventoLink(input);
        await carregarEventos();
      } finally {
        setIsSalvando(false);
      }
    },
    [carregarEventos],
  );

  const alternarAtivoLink = useCallback(
    async (linkId: string) => {
      await eventosApi.alternarAtivoLink(linkId);
      await carregarEventos();
    },
    [carregarEventos],
  );

  return {
    eventos,
    isLoading,
    isSalvando,
    hasError,
    criarEvento,
    criarEventoLink,
    alternarAtivoLink,
  };
}
