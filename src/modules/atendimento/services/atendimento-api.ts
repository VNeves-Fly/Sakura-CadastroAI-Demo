import type {
  Conversa,
  Mensagem,
  TextoPronto,
  EnviarMensagemInput,
  AssumirAtendimentoInput,
  CriarTextoProntoInput,
} from "@/modules/atendimento/types/atendimento.types";
import {
  gerarConversasMock,
  gerarTextosProntosMock,
  gerarTemplatesAprovadosMock,
} from "@/modules/atendimento/mock/atendimento-mock.data";

// Troque pelas chamadas reais (fetch pra uma rota /api/atendimento/*)
// quando o back-end existir — hoje não existe nem as tabelas
// (Conversa/Mensagem/TextoPronto/AssumirAtendimento) nem a integração
// com a API do WhatsApp Business (Meta), então esse service só finge
// ser uma API (funções async, mesma assinatura que uma real teria) por
// cima de um "banco" em memória. Decisão explícita do usuário
// (2026-07-23): construir o front primeiro, back depois.

export const HORAS_LIMITE_ASSUMIR = 2;

// "Banco" em memória — módulo é singleton no processo do navegador, então
// o estado sobrevive entre chamadas (mas reseta a cada reload de página,
// já que não é persistido de verdade).
let conversas = gerarConversasMock();
let textosProntos = gerarTextosProntosMock();
const templatesAprovados = gerarTemplatesAprovadosMock();

function atraso(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

export function podeAssumirAtendimento(atendimentoAtual: Conversa["atendimentoAtual"]): boolean {
  if (!atendimentoAtual) return true;
  const horasDesdeAssumiu =
    (Date.now() - new Date(atendimentoAtual.assumidoEm).getTime()) / (1000 * 60 * 60);
  return horasDesdeAssumiu > HORAS_LIMITE_ASSUMIR;
}

export const atendimentoApi = {
  async listarConversas(): Promise<Conversa[]> {
    await atraso();
    return clonar(conversas);
  },

  async listarTemplatesAprovados() {
    await atraso();
    return clonar(templatesAprovados);
  },

  async listarTextosProntos(): Promise<TextoPronto[]> {
    await atraso();
    return clonar(textosProntos);
  },

  async criarTextoPronto(input: CriarTextoProntoInput): Promise<TextoPronto> {
    await atraso();
    const novo: TextoPronto = { id: crypto.randomUUID(), ...input };
    textosProntos = [...textosProntos, novo];
    return clonar(novo);
  },

  // Marca as mensagens do cliente como vistas — zera o badge de não
  // lidas da conversa (mesmo comportamento de abrir qualquer chat).
  async marcarComoLida(conversaId: string): Promise<Conversa> {
    await atraso(50);
    conversas = conversas.map((conversa) =>
      conversa.id === conversaId
        ? {
            ...conversa,
            mensagens: conversa.mensagens.map((mensagem) =>
              mensagem.autor === "cliente" ? { ...mensagem, lido: true } : mensagem,
            ),
          }
        : conversa,
    );
    const atualizada = conversas.find((conversa) => conversa.id === conversaId);
    if (!atualizada) throw new Error("Conversa não encontrada.");
    return clonar(atualizada);
  },

  async enviarMensagem(
    conversaId: string,
    analistaNome: string,
    input: EnviarMensagemInput,
  ): Promise<Mensagem> {
    await atraso();
    const novaMensagem: Mensagem = {
      id: crypto.randomUUID(),
      conversaId,
      autor: "analista",
      analistaNome,
      createdAt: new Date().toISOString(),
      // Mock: nunca temos confirmação real de leitura do cliente (não
      // existe webhook de verdade) — fica sempre "entregue" (1 check),
      // nunca "lido" (2 checks azuis), pra não simular um dado que não
      // existe.
      lido: false,
      ...input,
    };

    conversas = conversas.map((conversa) =>
      conversa.id === conversaId
        ? {
            ...conversa,
            mensagens: [...conversa.mensagens, novaMensagem],
            updatedAt: novaMensagem.createdAt,
            lastMessageAt: novaMensagem.createdAt,
          }
        : conversa,
    );

    return clonar(novaMensagem);
  },

  async assumirAtendimento(conversaId: string, input: AssumirAtendimentoInput): Promise<Conversa> {
    await atraso();
    const conversa = conversas.find((item) => item.id === conversaId);
    if (!conversa) throw new Error("Conversa não encontrada.");
    if (!podeAssumirAtendimento(conversa.atendimentoAtual)) {
      throw new Error("Esta conversa ainda está com outro analista há menos de 2h.");
    }

    const agoraIso = new Date().toISOString();
    const novoRegistro = {
      analistaNome: input.analistaNome,
      assumidoEm: agoraIso,
      liberadoEm: null,
    };

    conversas = conversas.map((item) => {
      if (item.id !== conversaId) return item;
      const atual = item.atendimentoAtual;
      const historicoFechado = atual
        ? item.historicoAtendimento.map((registro) =>
            registro.analistaNome === atual.analistaNome && registro.assumidoEm === atual.assumidoEm
              ? { ...registro, liberadoEm: agoraIso }
              : registro,
          )
        : item.historicoAtendimento;

      return {
        ...item,
        atendimentoAtual: novoRegistro,
        historicoAtendimento: [...historicoFechado, novoRegistro],
      };
    });

    const atualizada = conversas.find((item) => item.id === conversaId);
    if (!atualizada) throw new Error("Conversa não encontrada.");
    return clonar(atualizada);
  },
};
