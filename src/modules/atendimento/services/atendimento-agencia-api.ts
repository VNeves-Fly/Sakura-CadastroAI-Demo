import type { SolicitacaoAtendimentoAgencia } from "@/modules/atendimento/types/atendimento-agencia.types";
import { TIMEOUT_SOLICITACAO_ATENDIMENTO_AGENCIA_MS } from "@/modules/atendimento/domain/atendimento.constants";

export { TIMEOUT_SOLICITACAO_ATENDIMENTO_AGENCIA_MS };

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

// Chamadas reais pra /api/atendimento/{agencias,solicitacoes}/* — atendimento
// do CADASTRO da agência (dossiê/listagem), distinto de atendimento-api.ts
// (chat/Conversa).
export const atendimentoAgenciaApi = {
  async solicitarTransferencia(
    agenciaId: string,
    paraAnalistaId: string,
  ): Promise<SolicitacaoAtendimentoAgencia> {
    return fetchJson<SolicitacaoAtendimentoAgencia>(
      `/api/atendimento/agencias/${agenciaId}/solicitacoes/transferencia`,
      { method: "POST", body: JSON.stringify({ paraAnalistaId }) },
    );
  },

  async solicitarAssuncao(agenciaId: string): Promise<SolicitacaoAtendimentoAgencia> {
    return fetchJson<SolicitacaoAtendimentoAgencia>(
      `/api/atendimento/agencias/${agenciaId}/solicitacoes/assuncao`,
      { method: "POST" },
    );
  },

  async confirmar(solicitacaoId: string): Promise<SolicitacaoAtendimentoAgencia> {
    return fetchJson<SolicitacaoAtendimentoAgencia>(
      `/api/atendimento/solicitacoes/${solicitacaoId}/confirmar`,
      { method: "POST" },
    );
  },

  async cancelar(solicitacaoId: string): Promise<SolicitacaoAtendimentoAgencia> {
    return fetchJson<SolicitacaoAtendimentoAgencia>(
      `/api/atendimento/solicitacoes/${solicitacaoId}/cancelar`,
      { method: "POST" },
    );
  },

  async listarPendentes(): Promise<SolicitacaoAtendimentoAgencia[]> {
    return fetchJson<SolicitacaoAtendimentoAgencia[]>("/api/atendimento/solicitacoes/pendentes");
  },
};
