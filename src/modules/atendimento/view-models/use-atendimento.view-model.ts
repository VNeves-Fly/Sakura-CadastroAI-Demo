import { useCallback, useEffect, useState } from "react";
import type {
  Conversa,
  TextoPronto,
  TemplateAprovado,
  EnviarMensagemInput,
} from "@/modules/atendimento/types/atendimento.types";
import { atendimentoApi } from "@/modules/atendimento/services/atendimento-api";

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

  const selecionarConversa = useCallback((id: string) => {
    setConversaSelecionadaId(id);
    void atendimentoApi.marcarComoLida(id).then((conversaAtualizada) => {
      setConversas((atual) =>
        atual.map((conversa) => (conversa.id === id ? conversaAtualizada : conversa)),
      );
    });
  }, []);

  const enviarMensagem = useCallback(
    async (conversaId: string, input: EnviarMensagemInput) => {
      setIsSending(true);
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
      }
    },
    [analistaAtual],
  );

  const assumirAtendimento = useCallback(
    async (conversaId: string) => {
      const conversaAtualizada = await atendimentoApi.assumirAtendimento(conversaId, {
        analistaNome: analistaAtual,
      });
      setConversas((atual) =>
        atual.map((conversa) => (conversa.id === conversaId ? conversaAtualizada : conversa)),
      );
    },
    [analistaAtual],
  );

  const criarTextoPronto = useCallback(async (titulo: string, conteudo: string) => {
    const novoTexto = await atendimentoApi.criarTextoPronto({ titulo, conteudo });
    setTextosProntos((atual) => [...atual, novoTexto]);
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
    criarTextoPronto,
  };
}
