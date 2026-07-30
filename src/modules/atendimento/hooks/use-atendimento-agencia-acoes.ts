"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSolicitacoesAtendimentoAgenciaStore } from "@/modules/atendimento/stores/solicitacoes-atendimento-agencia.store";
import { useToastStore } from "@/modules/shared/stores/toast.store";
import { atendimentoAgenciaApi } from "@/modules/atendimento/services/atendimento-agencia-api";
import type { AtendimentoAgenciaAtual } from "@/modules/atendimento/types/atendimento-agencia.types";

// Lê a pendente da agência do store global (alimentado por
// SolicitacoesAtendimentoAgenciaLive, montado uma vez no layout — nenhum
// componente daqui abre conexão SSE própria) e dispara as quatro ações de
// escrita (Iniciar/Encerrar/Transferir/Assumir). Usado no dossiê, na
// listagem e no chat.
export function useAtendimentoAgenciaAcoes(agenciaId: string) {
  const pendente = useSolicitacoesAtendimentoAgenciaStore((state) =>
    state.pendenteDaAgencia(agenciaId),
  );
  const upsertPendente = useSolicitacoesAtendimentoAgenciaStore((state) => state.upsertPendente);
  const mostrarToast = useToastStore((state) => state.mostrarToast);
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  // Iniciar/Encerrar não passam por SolicitacaoAtendimentoAgencia (não têm
  // negociação/timeout) e AtendimentoAgencia não tem canal SSE próprio —
  // sobrescreve localmente o atendimentoAtual recebido por prop até o
  // dossiê/listagem revalidar (router.refresh()) ou o chat reler a lista.
  const [atendimentoAtualOverride, setAtendimentoAtualOverride] = useState<
    AtendimentoAgenciaAtual | null | undefined
  >(undefined);

  async function iniciar(): Promise<void> {
    setEnviando(true);
    try {
      const atual = await atendimentoAgenciaApi.iniciar(agenciaId);
      setAtendimentoAtualOverride(atual);
      router.refresh();
    } catch (error) {
      mostrarToast((error as Error).message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function encerrar(): Promise<void> {
    setEnviando(true);
    try {
      await atendimentoAgenciaApi.encerrar(agenciaId);
      setAtendimentoAtualOverride(null);
      router.refresh();
    } catch (error) {
      mostrarToast((error as Error).message, "erro");
    } finally {
      setEnviando(false);
    }
  }

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

  return {
    pendente,
    enviando,
    atendimentoAtualOverride,
    iniciar,
    encerrar,
    solicitarTransferencia,
    solicitarAssuncao,
  };
}
