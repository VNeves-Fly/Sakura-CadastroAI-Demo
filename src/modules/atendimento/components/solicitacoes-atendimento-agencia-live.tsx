"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSolicitacoesAtendimentoAgenciaStore } from "@/modules/atendimento/stores/solicitacoes-atendimento-agencia.store";
import { useToastStore, type TipoToast } from "@/modules/shared/stores/toast.store";
import { atendimentoAgenciaApi } from "@/modules/atendimento/services/atendimento-agencia-api";
import type { SolicitacaoAtendimentoAgencia } from "@/modules/atendimento/types/atendimento-agencia.types";
import { SolicitacaoAtendimentoAgenciaToast } from "@/modules/atendimento/components/solicitacao-atendimento-agencia-toast";

const INTERVALO_POLLING_SEGURANCA_MS = 60_000;

function textoToastFinal(
  solicitacao: SolicitacaoAtendimentoAgencia,
): [string, TipoToast, { titulo?: string }] {
  if (solicitacao.status === "aceita") {
    return solicitacao.tipo === "transferencia"
      ? [solicitacao.agenciaNome, "sucesso", { titulo: "Atendimento transferido" }]
      : ["Atendimento assumido com sucesso", "sucesso", {}];
  }
  return solicitacao.tipo === "transferencia"
    ? ["Transferência cancelada", "erro", {}]
    : ["Não foi possível assumir o atendimento", "erro", {}];
}

// Assina /api/atendimento/solicitacoes/eventos e mostra o toast de
// transferência/assunção de atendimento do CADASTRO em QUALQUER tela do
// admin — montado uma única vez no layout (não numa página específica),
// mesmo padrão de NotificacoesDocumentosLive: 1 conexão SSE por sessão de
// browser, sobrevive à navegação entre páginas.
export function SolicitacoesAtendimentoAgenciaLive() {
  const definirPendentes = useSolicitacoesAtendimentoAgenciaStore(
    (state) => state.definirPendentes,
  );
  const upsertPendente = useSolicitacoesAtendimentoAgenciaStore((state) => state.upsertPendente);
  const removerResolvida = useSolicitacoesAtendimentoAgenciaStore(
    (state) => state.removerResolvida,
  );
  const mostrarToast = useToastStore((state) => state.mostrarToast);
  const router = useRouter();

  useEffect(() => {
    let ativo = true;
    const hidratar = () => {
      atendimentoAgenciaApi
        .listarPendentes()
        .then((lista) => {
          if (ativo) definirPendentes(lista);
        })
        .catch(() => {});
    };
    hidratar();

    const eventSource = new EventSource("/api/atendimento/solicitacoes/eventos");
    eventSource.onmessage = (event) => {
      let solicitacao: SolicitacaoAtendimentoAgencia;
      try {
        solicitacao = JSON.parse(event.data);
      } catch {
        return;
      }

      if (solicitacao.status === "pendente") {
        upsertPendente(solicitacao);
        return;
      }

      removerResolvida(solicitacao.id);
      const [mensagem, tipo, opcoes] = textoToastFinal(solicitacao);
      mostrarToast(mensagem, tipo, opcoes);
      // Dossiê/listagem em tela (se abertos) passam a refletir o novo
      // atendente sem precisar de F5.
      router.refresh();
    };

    // Rede de segurança — cobre SSE que caia silenciosamente e faz a
    // expiração preguiçosa (ver expirarPendentesVencidas) aparecer mesmo
    // sem evento novo no banco.
    const poll = setInterval(hidratar, INTERVALO_POLLING_SEGURANCA_MS);

    return () => {
      ativo = false;
      eventSource.close();
      clearInterval(poll);
    };
  }, [definirPendentes, upsertPendente, removerResolvida, mostrarToast, router]);

  return <SolicitacaoAtendimentoAgenciaToast />;
}
