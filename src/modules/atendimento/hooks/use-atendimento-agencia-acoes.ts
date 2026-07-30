"use client";

import { useState } from "react";
import { useSolicitacoesAtendimentoAgenciaStore } from "@/modules/atendimento/stores/solicitacoes-atendimento-agencia.store";
import { useToastStore } from "@/modules/shared/stores/toast.store";
import { atendimentoAgenciaApi } from "@/modules/atendimento/services/atendimento-agencia-api";

// Lê a pendente da agência do store global (alimentado por
// SolicitacoesAtendimentoAgenciaLive, montado uma vez no layout — nenhum
// componente daqui abre conexão SSE própria) e dispara as duas ações de
// escrita. Usado tanto no dossiê quanto na listagem.
export function useAtendimentoAgenciaAcoes(agenciaId: string) {
  const pendente = useSolicitacoesAtendimentoAgenciaStore((state) =>
    state.pendenteDaAgencia(agenciaId),
  );
  const upsertPendente = useSolicitacoesAtendimentoAgenciaStore((state) => state.upsertPendente);
  const mostrarToast = useToastStore((state) => state.mostrarToast);
  const [enviando, setEnviando] = useState(false);

  async function solicitarTransferencia(paraAnalistaId: string): Promise<void> {
    setEnviando(true);
    try {
      const solicitacao = await atendimentoAgenciaApi.solicitarTransferencia(
        agenciaId,
        paraAnalistaId,
      );
      upsertPendente(solicitacao);
    } catch (error) {
      mostrarToast((error as Error).message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function solicitarAssuncao(): Promise<void> {
    setEnviando(true);
    try {
      const solicitacao = await atendimentoAgenciaApi.solicitarAssuncao(agenciaId);
      upsertPendente(solicitacao);
    } catch (error) {
      mostrarToast((error as Error).message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  return { pendente, enviando, solicitarTransferencia, solicitarAssuncao };
}
