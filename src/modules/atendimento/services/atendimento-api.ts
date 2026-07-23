import type {
  Conversa,
  Mensagem,
  TextoPronto,
  TemplateAprovado,
  EnviarMensagemInput,
  AssumirAtendimentoInput,
  CriarTextoProntoInput,
} from "@/modules/atendimento/types/atendimento.types";
import { HORAS_LIMITE_ASSUMIR } from "@/modules/atendimento/domain/atendimento.constants";

// Chamadas reais pra /api/atendimento/* — mesma assinatura que o mock
// tinha, então os componentes/view-model não mudaram nada.
export { HORAS_LIMITE_ASSUMIR };

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new Error(corpo?.error ?? `Erro ${response.status} ao chamar ${input}.`);
  }

  return response.json() as Promise<T>;
}

export function podeAssumirAtendimento(atendimentoAtual: Conversa["atendimentoAtual"]): boolean {
  if (!atendimentoAtual) return true;
  const horasDesdeAssumiu =
    (Date.now() - new Date(atendimentoAtual.assumidoEm).getTime()) / (1000 * 60 * 60);
  return horasDesdeAssumiu > HORAS_LIMITE_ASSUMIR;
}

export const atendimentoApi = {
  async listarConversas(): Promise<Conversa[]> {
    return fetchJson<Conversa[]>("/api/atendimento/conversas");
  },

  async listarTemplatesAprovados(): Promise<TemplateAprovado[]> {
    return fetchJson<TemplateAprovado[]>("/api/atendimento/templates");
  },

  async listarTextosProntos(): Promise<TextoPronto[]> {
    return fetchJson<TextoPronto[]>("/api/atendimento/textos-prontos");
  },

  async criarTextoPronto(input: CriarTextoProntoInput): Promise<TextoPronto> {
    return fetchJson<TextoPronto>("/api/atendimento/textos-prontos", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Marca as mensagens do cliente como vistas — zera o badge de não
  // lidas da conversa (mesmo comportamento de abrir qualquer chat).
  async marcarComoLida(conversaId: string): Promise<Conversa> {
    return fetchJson<Conversa>(`/api/atendimento/conversas/${conversaId}/marcar-lida`, {
      method: "POST",
    });
  },

  async enviarMensagem(
    conversaId: string,
    analistaNome: string,
    input: EnviarMensagemInput,
  ): Promise<Mensagem> {
    // `analistaNome` continua na assinatura por compatibilidade com quem
    // já chama esta função (thread-conversa.tsx, use-atendimento hook) —
    // o backend ignora esse campo pra autorização e resolve o analista
    // real a partir da sessão (ver atendimento.routes.ts).
    return fetchJson<Mensagem>(`/api/atendimento/conversas/${conversaId}/mensagens`, {
      method: "POST",
      body: JSON.stringify({ analistaNome, ...input }),
    });
  },

  async assumirAtendimento(conversaId: string, input: AssumirAtendimentoInput): Promise<Conversa> {
    return fetchJson<Conversa>(`/api/atendimento/conversas/${conversaId}/assumir`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
