import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Conversa,
  TextoPronto,
  TemplateAprovado,
  EnviarMensagemInput,
} from "@/modules/atendimento/types/atendimento.types";
import { atendimentoApi } from "@/modules/atendimento/services/atendimento-api";

const INTERVALO_POLLING_MS = 4_000;

// Hook central do módulo — mesmo formato de useChatSession.ts (trazido
// pelo usuário como referência): carrega estado via um "api" service,
// expõe ações que chamam esse mesmo service, guarda loading/erro. Troque
// o service internamente quando o back-end existir; este hook e os
// componentes que o consomem não precisam mudar.
export function useAtendimento(analistaAtual: string) {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionadaId, setConversaSelecionadaId] = useState<string | null>(null);
  const [textosProntos, setTextosProntos] = useState<TextoPronto[]>([]);
  const [templatesAprovados, setTemplatesAprovados] = useState<TemplateAprovado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasError, setHasError] = useState(false);
  // Evita que o polling em segundo plano sobrescreva uma ação que o
  // próprio analista acabou de disparar (ex: mandar mensagem) antes da
  // resposta chegar — só reflete o servidor quando nada está em voo.
  const acaoEmAndamentoRef = useRef(false);

  const carregarTudo = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [conversasCarregadas, textos, templates] = await Promise.all([
        atendimentoApi.listarConversas(),
        atendimentoApi.listarTextosProntos(),
        atendimentoApi.listarTemplatesAprovados(),
      ]);
      setConversas(conversasCarregadas);
      setTextosProntos(textos);
      setTemplatesAprovados(templates);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarTudo();
  }, [carregarTudo]);

  // Polling leve — só assim uma expiração de transferência (resolvida
  // sozinha dentro do service depois de 60s) ou uma resposta de outro
  // analista aparecem na tela sem precisar recarregar a página. Troque
  // por push real (websocket/SSE) quando o back-end existir.
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (acaoEmAndamentoRef.current) return;
      void atendimentoApi.listarConversas().then(setConversas);
    }, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, []);

  // Só marca como lida se o analista atual já é o dono do atendimento —
  // decisão explícita do usuário (2026-07-23): abrir uma conversa que
  // ninguém assumiu (ou que é de outro analista) NÃO pode fazer o badge
  // de não lidas sumir sozinho, senão dá pra "espiar" sem realmente
  // assumir a responsabilidade de atender. Quem já é dono e reabre a
  // conversa continua vendo o badge sumir normalmente (marcarComoLida
  // também roda de novo em assumirAtendimento, ver abaixo).
  const selecionarConversa = useCallback(
    (id: string) => {
      setConversaSelecionadaId(id);
      const conversa = conversas.find((item) => item.id === id);
      if (conversa?.atendimentoAtual?.analistaNome !== analistaAtual) return;

      void atendimentoApi.marcarComoLida(id).then((conversaAtualizada) => {
        setConversas((atual) => atual.map((item) => (item.id === id ? conversaAtualizada : item)));
      });
    },
    [conversas, analistaAtual],
  );

  const enviarMensagem = useCallback(
    async (conversaId: string, input: EnviarMensagemInput) => {
      setIsSending(true);
      acaoEmAndamentoRef.current = true;
      try {
        const mensagem = await atendimentoApi.enviarMensagem(conversaId, analistaAtual, input);
        setConversas((atual) =>
          atual.map((conversa) =>
            conversa.id === conversaId
              ? {
                  ...conversa,
                  mensagens: [...conversa.mensagens, mensagem],
                  lastMessageAt: mensagem.createdAt,
                }
              : conversa,
          ),
        );
      } finally {
        setIsSending(false);
        acaoEmAndamentoRef.current = false;
      }
    },
    [analistaAtual],
  );

  const assumirAtendimento = useCallback(
    async (conversaId: string) => {
      await atendimentoApi.assumirAtendimento(conversaId, { analistaNome: analistaAtual });
      // Assumir já conta como "vi tudo que tinha" — some o badge de não
      // lidas na mesma ação, sem precisar reabrir a conversa de novo.
      const conversaLida = await atendimentoApi.marcarComoLida(conversaId);
      setConversas((atual) =>
        atual.map((conversa) => (conversa.id === conversaId ? conversaLida : conversa)),
      );
    },
    [analistaAtual],
  );

  const encerrarAtendimento = useCallback(async (conversaId: string) => {
    const conversaAtualizada = await atendimentoApi.encerrarAtendimento(conversaId);
    setConversas((atual) =>
      atual.map((conversa) => (conversa.id === conversaId ? conversaAtualizada : conversa)),
    );
  }, []);

  const solicitarTransferencia = useCallback(
    async (conversaId: string, paraAnalista: string) => {
      const conversaAtualizada = await atendimentoApi.solicitarTransferencia(conversaId, {
        deAnalista: analistaAtual,
        paraAnalista,
      });
      setConversas((atual) =>
        atual.map((conversa) => (conversa.id === conversaId ? conversaAtualizada : conversa)),
      );
    },
    [analistaAtual],
  );

  const responderTransferencia = useCallback(async (conversaId: string, aceita: boolean) => {
    const conversaAtualizada = await atendimentoApi.responderTransferencia(conversaId, { aceita });
    setConversas((atual) =>
      atual.map((conversa) => (conversa.id === conversaId ? conversaAtualizada : conversa)),
    );
  }, []);

  const limparSolicitacaoResolvida = useCallback(async (conversaId: string) => {
    const conversaAtualizada = await atendimentoApi.limparSolicitacaoResolvida(conversaId);
    setConversas((atual) =>
      atual.map((conversa) => (conversa.id === conversaId ? conversaAtualizada : conversa)),
    );
  }, []);

  const criarTextoPronto = useCallback(async (titulo: string, conteudo: string) => {
    const novoTexto = await atendimentoApi.criarTextoPronto({ titulo, conteudo });
    setTextosProntos((atual) => [...atual, novoTexto]);
  }, []);

  const atualizarTextoPronto = useCallback(async (id: string, titulo: string, conteudo: string) => {
    const atualizado = await atendimentoApi.atualizarTextoPronto(id, { titulo, conteudo });
    setTextosProntos((atual) => atual.map((texto) => (texto.id === id ? atualizado : texto)));
  }, []);

  const removerTextoPronto = useCallback(async (id: string) => {
    await atendimentoApi.removerTextoPronto(id);
    setTextosProntos((atual) => atual.filter((texto) => texto.id !== id));
  }, []);

  return {
    conversas,
    conversaSelecionadaId,
    textosProntos,
    templatesAprovados,
    isLoading,
    isSending,
    hasError,
    selecionarConversa,
    enviarMensagem,
    assumirAtendimento,
    encerrarAtendimento,
    solicitarTransferencia,
    responderTransferencia,
    limparSolicitacaoResolvida,
    criarTextoPronto,
    atualizarTextoPronto,
    removerTextoPronto,
  };
}
