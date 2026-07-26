import type { Evento, CriarEventoInput } from "@/modules/eventos/types/evento.types";

async function tratarResposta<T>(resposta: Response): Promise<T> {
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new Error(corpo?.error ?? "Não foi possível completar a operação.");
  }
  return resposta.json() as Promise<T>;
}

export const eventosApi = {
  async listarEventos(): Promise<Evento[]> {
    const resposta = await fetch("/api/eventos");
    return tratarResposta<Evento[]>(resposta);
  },

  async criarEvento(input: CriarEventoInput): Promise<Evento> {
    const resposta = await fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return tratarResposta<Evento>(resposta);
  },
};
