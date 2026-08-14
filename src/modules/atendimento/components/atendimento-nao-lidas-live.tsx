"use client";

import { useEffect } from "react";
import { useAtendimentoNaoLidasStore } from "@/modules/atendimento/stores/atendimento-nao-lidas.store";
import { atendimentoApi } from "@/modules/atendimento/services/atendimento-api";

const INTERVALO_POLLING_SEGURANCA_MS = 60_000;

// Alimenta o badge de "não lidas" do item Atendimento no sidebar, visível em
// QUALQUER tela do admin — montado uma única vez no layout, mesmo padrão de
// NotificacoesDocumentosLive/SolicitacoesAtendimentoAgenciaLive. Reaproveita
// o canal SSE /api/atendimento/eventos (já existe, alimenta /atendimento);
// aqui só refazemos a contagem agregada, nunca a lista inteira de conversas.
export function AtendimentoNaoLidasLive() {
  const definirTotal = useAtendimentoNaoLidasStore((state) => state.definirTotal);

  useEffect(() => {
    let ativo = true;
    const atualizar = () => {
      atendimentoApi
        .contarNaoLidas()
        .then(({ total }) => {
          if (ativo) definirTotal(total);
        })
        .catch(() => {});
    };
    atualizar();

    const eventSource = new EventSource("/api/atendimento/eventos");
    eventSource.onmessage = atualizar;

    // Rede de segurança — cobre SSE que caia silenciosamente sem disparar
    // "onerror" (o EventSource já reconecta sozinho em erro).
    const poll = setInterval(atualizar, INTERVALO_POLLING_SEGURANCA_MS);

    return () => {
      ativo = false;
      eventSource.close();
      clearInterval(poll);
    };
  }, [definirTotal]);

  return null;
}
