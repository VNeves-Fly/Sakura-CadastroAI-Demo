"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Evento,
  Executivo,
  CriarEventoInput,
  CriarEventoLinkInput,
} from "@/modules/eventos/types/evento.types";
import { eventosApi } from "@/modules/eventos/services/eventos-api";

export function useEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [executivos, setExecutivos] = useState<Executivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  const [hasError, setHasError] = useState(false);

  const carregarTudo = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [eventosCarregados, executivosCarregados] = await Promise.all([
        eventosApi.listarEventos(),
        eventosApi.listarExecutivos(),
      ]);
      setEventos(eventosCarregados);
      setExecutivos(executivosCarregados);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarTudo();
  }, [carregarTudo]);

  const criarEvento = useCallback(async (input: CriarEventoInput) => {
    setIsSalvando(true);
    try {
      const novoEvento = await eventosApi.criarEvento(input);
      setEventos((atual) => [novoEvento, ...atual]);
    } finally {
      setIsSalvando(false);
    }
  }, []);

  const criarEventoLink = useCallback(async (input: CriarEventoLinkInput) => {
    setIsSalvando(true);
    try {
      const eventoAtualizado = await eventosApi.criarEventoLink(input);
      setEventos((atual) =>
        atual.map((evento) => (evento.id === eventoAtualizado.id ? eventoAtualizado : evento)),
      );
    } finally {
      setIsSalvando(false);
    }
  }, []);

  const alternarAtivoLink = useCallback(async (linkId: string) => {
    const eventoAtualizado = await eventosApi.alternarAtivoLink(linkId);
    setEventos((atual) =>
      atual.map((evento) => (evento.id === eventoAtualizado.id ? eventoAtualizado : evento)),
    );
  }, []);

  return {
    eventos,
    executivos,
    isLoading,
    isSalvando,
    hasError,
    criarEvento,
    criarEventoLink,
    alternarAtivoLink,
  };
}
