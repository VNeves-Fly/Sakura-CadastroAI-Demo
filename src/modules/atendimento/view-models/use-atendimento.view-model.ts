import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Conversa,
  TextoPronto,
  TemplateAprovado,
  EnviarMensagemInput,
  ContatoAgencia,
  NumeroContato,
  VincularConversaAgenciaInput,
} from "@/modules/atendimento/types/atendimento.types";
import { atendimentoApi } from "@/modules/atendimento/services/atendimento-api";
import { useAtendimentoNaoLidasStore } from "@/modules/atendimento/stores/atendimento-nao-lidas.store";
import { paraWhatsappId, telefonesEquivalentes } from "@/modules/shared/utils/telefone.util";

export type AbaListaLateral = "conversas" | "contatos";

export interface ModalEscolhaContato {
  agenciaNome: string;
  numeros: NumeroContato[];
}

// Rede de segurança bem espaçada — cobre o caso raro da conexão SSE cair
// silenciosamente sem disparar "onerror" (o EventSource já reconecta
// sozinho em erro; isso aqui é só um fallback).
const INTERVALO_POLLING_SEGURANCA_MS = 60_000;

// Hook central do módulo — mesmo formato de useChatSession.ts (trazido
// pelo usuário como referência): carrega estado via um "api" service,
// expõe ações que chamam esse mesmo service, guarda loading/erro. Troque
// o service internamente quando o back-end existir; este hook e os
// componentes que o consomem não precisam mudar.
//
// Ações de atendimento (Iniciar/Encerrar/Transferir/Assumir) não vivem
// mais aqui — atendimento é sempre da AGÊNCIA (AtendimentoAgencia), não da
// conversa, e é gerenciado por AtendimentoAgenciaAcoes/
// useAtendimentoAgenciaAcoes (compartilhado com o dossiê/listagem de
// cadastros), chaveado por conversa.agenciaId. `analistaId` é a chave de
// identidade real (comparações "sou eu"); `analistaNome` é só exibição.
export function useAtendimento(
  analistaId: string,
  analistaNome: string,
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

  // Push real via SSE — o servidor avisa (mensagem nova) e aqui só
  // refazemos listarConversas() por completo, igual o polling que isso
  // substituiu. O EventSource reconecta sozinho em erro/timeout. Mudança
  // de atendimento (Iniciar/Encerrar/Transferir/Assumir) chega por um
  // canal à parte (ver SolicitacoesAtendimentoAgenciaLive, montado no
  // layout do admin), que já dispara router.refresh() — esse aqui é só
  // pra mensagem nova/lida.
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
  // assumir a responsabilidade de atender. Contato "não identificado"
  // (sem agenciaId) não tem conceito de atendimento nenhum pra assumir —
  // mesma exceção de `podeResponder` em ThreadConversa — senão essas
  // mensagens nunca seriam marcadas como lidas, ficando pra sempre no
  // badge global.
  const selecionarConversa = useCallback(
    (id: string) => {
      setConversaSelecionadaId(id);
      const conversa = conversas.find((item) => item.id === id);
      if (conversa?.agenciaId && conversa.atendimentoAtual?.analistaId !== analistaId) return;

      void atendimentoApi.marcarComoLida(id).then((conversaAtualizada) => {
        setConversas((atual) => atual.map((item) => (item.id === id ? conversaAtualizada : item)));
        // A trigger Postgres do canal SSE só dispara em INSERT de mensagem
        // (ver docs/realtime-sse.md) — marcar como lida é um UPDATE, então
        // o badge do sidebar não cai sozinho sem esta chamada explícita.
        void atendimentoApi
          .contarNaoLidas()
          .then(({ total }) => useAtendimentoNaoLidasStore.getState().definirTotal(total));
      });
    },
    [conversas, analistaId],
  );

  const enviarMensagem = useCallback(
    async (conversaId: string, input: EnviarMensagemInput) => {
      setIsSending(true);
      acaoEmAndamentoRef.current = true;
      try {
        const mensagem = await atendimentoApi.enviarMensagem(conversaId, analistaNome, input);
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
    [analistaNome],
  );

  // Insere ou substitui — diferente do `.map` usado por selecionarConversa,
  // que assume a conversa já está em `conversas`. Uma conversa recém-criada
  // pela lista de Contatos ainda não está na lista local.
  const upsertConversa = useCallback((conversa: Conversa) => {
    setConversas((atual) => {
      const existe = atual.some((item) => item.id === conversa.id);
      return existe
        ? atual.map((item) => (item.id === conversa.id ? conversa : item))
        : [conversa, ...atual];
    });
  }, []);

  // Liga a conversa "não identificada" selecionada a uma agência escolhida
  // manualmente pelo analista — ver VincularConversaModal em
  // painel-informacoes.tsx. A conversa devolvida já vem com agenciaId
  // preenchido, então as regras normais de atendimento passam a valer
  // imediatamente (podeResponder, badge de não lidas etc).
  const vincularConversaAgencia = useCallback(
    async (conversaId: string, input: VincularConversaAgenciaInput) => {
      const conversaVinculada = await atendimentoApi.vincularConversaAgencia(conversaId, input);
      upsertConversa(conversaVinculada);
    },
    [upsertConversa],
  );

  // Fluxo único pros dois casos: número já com Conversa materializada ou
  // número que nunca trocou mensagem (cria via iniciarConversa — exige
  // atendimento da agência já assumido, ver IniciarConversaUseCase). Não
  // força mais "assumir" a conversa depois de criá-la/selecioná-la — quem
  // atende a agência é decidido só por AtendimentoAgenciaAcoes, exibido na
  // própria thread; aqui só marca como lida se quem está selecionando já é
  // o dono.
  const selecionarNumeroContato = useCallback(
    async (numero: NumeroContato) => {
      setModalEscolha(null);
      acaoEmAndamentoRef.current = true;
      try {
        let conversa = conversas.find((item) => item.id === numero.conversaId);
        if (!conversa) {
          conversa = await atendimentoApi.iniciarConversa({
            agenciaId: numero.agenciaId,
            telefoneWhatsapp: paraWhatsappId(numero.telefone),
            representanteLegalId: numero.representanteLegalId,
            membroNome: numero.label,
            membroPapel: numero.papel,
          });
          upsertConversa(conversa);
        }
        setConversaSelecionadaId(conversa.id);
        setAbaListaLateral("conversas");

        if (conversa.atendimentoAtual?.analistaId === analistaId) {
          const conversaLida = await atendimentoApi.marcarComoLida(conversa.id);
          upsertConversa(conversaLida);
        }
      } finally {
        acaoEmAndamentoRef.current = false;
      }
    },
    [conversas, upsertConversa, analistaId],
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
    vincularConversaAgencia,
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
