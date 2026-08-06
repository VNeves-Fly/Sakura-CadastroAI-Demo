// Tempo decorrido em texto curto ("agora mesmo", "há 45 min", "há 3h", "há
// 2 dias") — usado em feeds de eventos recentes (ex.: últimas
// movimentações do dashboard). Existe uma versão parecida, mas só até
// horas, em atendimento-formato.util.ts; essa aqui cobre dias também e
// fica em shared por não ser específica de nenhum módulo.
export function formatarTempoRelativo(data: Date): string {
  const minutos = Math.floor((Date.now() - data.getTime()) / (1000 * 60));
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;

  const dias = Math.floor(horas / 24);
  return `há ${dias} dia${dias > 1 ? "s" : ""}`;
}
