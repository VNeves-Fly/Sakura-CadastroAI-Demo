import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Conversa,
  TextoPronto,
  TemplateAprovado,
  EnviarMensagemInput,
  ContatoAgencia,
  NumeroContato,
} from "@/modules/atendimento/types/atendimento.types";
import { atendimentoApi } from "@/modules/atendimento/services/atendimento-api";
import { paraWhatsappId, telefonesEquivalentes } from "@/modules/shared/utils/telefone.util";

export type AbaListaLateral = "conversas" | "contatos";

export interface ModalEscolhaContato {
  agenciaNome: string;
  numeros: NumeroContato[];
}

// Rede de segurança bem espaçada — cobre o caso raro da conexão SSE cair
// silenciosamente sem disparar "onerror" (o EventSource já reconecta
// sozinho em erro; isso aqui é só um fallback). Também é o que garante que
// uma transferência expirada "preguiçosamente" (sem nenhum evento novo no
// banco) apareça na tela mesmo sem push nenhum.
const INTERVALO_POLLING_SEGURANCA_MS = 60_000;

// Hook central do módulo — mesmo formato de useChatSession.ts (trazido
// pelo usuário como referência): carrega estado via um "api" service,
// expõe ações que chamam esse mesmo service, guarda loading/erro. Troque
// o service internamente quando o back-end existir; este hook e os
// componentes que o consomem não precisam mudar.
export function useAtendimento(
  analistaAtual: string,
  telefoneInicial?: string,
  agenciaIdInicial?: string,
) {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionadaId, setConversaSelecionadaId] = useState<string | null>(null);
  // `?telefone=` do dossiê (ver AtendimentoButton) — seleciona a conversa
  // correspondente assim que a lista carrega, uma única vez (não deve
  // "puxar" o analista de volta pra essa conversa depois que ele troca de
  // conversa manualmente ou quando o polling/SSE atualiza a lista).
  const telefoneInicialConsumidoRef = useRef(false);
  const [textosProntos, setTextosProntos] = useState<TextoPronto[]>([]);
  const [templatesAprovados, setTemplatesAprovados] = useState<TemplateAprovado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Aba "Contatos" — todas as agências, tenham conversa iniciada ou não
  // (ver ListaContatos/ModalEscolhaContato). Estado próprio, não persiste
  // no Zustand: mesmo padrão do resto do módulo (hook local).
  const [abaListaLateral, setAbaListaLateral] = useState<AbaListaLateral>("conversas");
  const [contatos, setContatos] = useState<ContatoAgencia[]>([]);
  const [buscaContatos, setBuscaContatos] = useState("");
  const [carregandoContatos, setCarregandoContatos] = useState(false);
  const [modalEscolha, setModalEscolha] = useState<ModalEscolhaContato | null>(null);
  // `?agenciaId=` do dossiê (ver AtendimentoButton, agora simplificado) —
  // mesmo padrão do `telefoneInicialConsumidoRef` acima, só consumido uma vez.
  const agenciaIdInicialConsumidoRef = useRef(false);
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

      if (telefoneInicial && !telefoneInicialConsumidoRef.current) {
        telefoneInicialConsumidoRef.current = true;
        const conversaAlvo = conversasCarregadas.find((conversa) =>
          telefonesEquivalentes(conversa.membro.telefone, telefoneInicial),
        );
        if (conversaAlvo) setConversaSelecionadaId(conversaAlvo.id);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [telefoneInicial]);

  useEffect(() => {
    void carregarTudo();
  }, [carregarTudo]);

  // Push real via SSE — o servidor avisa (mensagem nova, atendimento
  // assumido/liberado, transferência solicitada/respondida) e aqui só
  // refazemos listarConversas() por completo, igual o polling que isso
  // substituiu. O EventSource reconecta sozinho em erro/timeout.
  useEffect(() => {
    const eventSource = new EventSource("/api/atendimento/eventos");
    eventSource.onmessage = () => {
      if (acaoEmAndamentoRef.current) return;
      void atendimentoApi.listarConversas().then(setConversas);
    };
    return () => eventSource.close();
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (acaoEmAndamentoRef.current) return;
      void atendimentoApi.listarConversas().then(setConversas);
    }, INTERVALO_POLLING_SEGURANCA_MS);
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

  // Insere ou substitui — diferente do `.map` usado pelas outras ações
  // acima, que assumem a conversa já está em `conversas`. Uma conversa
  // recém-criada pela lista de Contatos ainda não está na lista local.
  const upsertConversa = useCallback((conversa: Conversa) => {
    setConversas((atual) => {
      const existe = atual.some((item) => item.id === conversa.id);
      return existe
        ? atual.map((item) => (item.id === conversa.id ? conversa : item))
        : [conversa, ...atual];
    });
  }, []);

  // Fluxo único pros dois casos (ver plano): número já com Conversa
  // materializada ou número que nunca trocou mensagem. Em ambos, termina
  // chamando assumirAtendimento — mesma trava de 2h de sempre, e a mesma
  // regra de "assumir já marca como lida".
  const selecionarNumeroContato = useCallback(
    async (numero: NumeroContato) => {
      setModalEscolha(null);
      acaoEmAndamentoRef.current = true;
      try {
        let conversaId = numero.conversaId;
        if (!conversaId) {
          const criada = await atendimentoApi.iniciarConversa({
            agenciaId: numero.agenciaId,
            telefoneWhatsapp: paraWhatsappId(numero.telefone),
            representanteLegalId: numero.representanteLegalId,
            membroNome: numero.label,
            membroPapel: numero.papel,
          });
          conversaId = criada.id;
        }
        await atendimentoApi.assumirAtendimento(conversaId, { analistaNome: analistaAtual });
        const conversaLida = await atendimentoApi.marcarComoLida(conversaId);
        upsertConversa(conversaLida);
        setConversaSelecionadaId(conversaLida.id);
        setAbaListaLateral("conversas");
      } finally {
        acaoEmAndamentoRef.current = false;
      }
    },
    [analistaAtual, upsertConversa],
  );

  // Só 1 número → escolhe direto, sem incomodar com modal (mesmo critério
  // que o AtendimentoButton do dossiê já usava antes de simplificar).
  const abrirEscolhaContato = useCallback(
    (contato: ContatoAgencia) => {
      const [unico] = contato.numeros;
      if (!unico) return;
      if (contato.numeros.length === 1) {
        void selecionarNumeroContato(unico);
        return;
      }
      setModalEscolha({ agenciaNome: contato.agenciaNome, numeros: contato.numeros });
    },
    [selecionarNumeroContato],
  );

  const fecharModalEscolha = useCallback(() => setModalEscolha(null), []);

  const buscarContatos = useCallback(async (busca: string) => {
    setBuscaContatos(busca);
    setCarregandoContatos(true);
    try {
      setContatos(await atendimentoApi.listarContatos(busca || undefined));
    } catch {
      setContatos([]);
    } finally {
      setCarregandoContatos(false);
    }
  }, []);

  const selecionarAba = useCallback((aba: AbaListaLateral) => setAbaListaLateral(aba), []);

  // Carrega a lista completa (busca vazia) sempre que a aba "Contatos" é
  // aberta — mais simples e previsível que persistir a última busca entre
  // idas e vindas.
  useEffect(() => {
    if (abaListaLateral !== "contatos") return;
    void buscarContatos("");
  }, [abaListaLateral, buscarContatos]);

  // `?agenciaId=` do dossiê — mesma ideia do `telefoneInicial`, mas
  // decide entre auto-selecionar (1 número) ou abrir o modal de escolha
  // (mais de 1), em vez de só selecionar uma conversa existente.
  useEffect(() => {
    if (!agenciaIdInicial || agenciaIdInicialConsumidoRef.current) return;
    agenciaIdInicialConsumidoRef.current = true;
    void atendimentoApi
      .obterContatoAgencia(agenciaIdInicial)
      .then(abrirEscolhaContato)
      .catch(() => setHasError(true));
  }, [agenciaIdInicial, abrirEscolhaContato]);

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
    abaListaLateral,
    selecionarAba,
    contatos,
    buscaContatos,
    carregandoContatos,
    buscarContatos,
    modalEscolha,
    fecharModalEscolha,
    abrirEscolhaContato,
    selecionarNumeroContato,
  };
}
