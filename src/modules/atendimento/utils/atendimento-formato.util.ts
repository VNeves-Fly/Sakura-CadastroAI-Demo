import type { PapelMembro } from "@/modules/atendimento/types/atendimento.types";

// Recebem sempre string ISO (formato que o front guarda, ver
// atendimento.types.ts) — parseiam pra Date só na hora de formatar.

export function formatarHorarioMensagem(dataIso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(dataIso),
  );
}

// Prévia da lista de conversas: hora se for hoje, "Ontem" se for o dia
// anterior, ou data curta — mesmo critério usado em apps de chat.
export function formatarPreviewData(dataIso: string): string {
  const data = new Date(dataIso);
  const agora = new Date();
  if (data.toDateString() === agora.toDateString()) {
    return formatarHorarioMensagem(dataIso);
  }
  const ontem = new Date(agora);
  ontem.setDate(ontem.getDate() - 1);
  if (data.toDateString() === ontem.toDateString()) {
    return "Ontem";
  }
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(data);
}

export function iniciaisNome(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const iniciais = partes
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
  return iniciais || "?";
}

export function labelPapelMembro(papel: PapelMembro): string {
  switch (papel) {
    case "socio":
      return "Sócio";
    case "representante_legal":
      return "Representante legal";
    case "comercial":
      return "Comercial";
    default:
      return "Outro";
  }
}

// Tempo decorrido em texto curto (ex: "há 45 min", "há 3h") — usado no
// banner de atendimento assumido.
export function formatarTempoDecorrido(dataIso: string): string {
  const minutos = Math.floor((Date.now() - new Date(dataIso).getTime()) / (1000 * 60));
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `há ${horas}h`;
}
