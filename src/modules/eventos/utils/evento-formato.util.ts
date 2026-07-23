// Tempo decorrido em texto curto (ex: "há 45 min", "há 3h", "há 5 dias").
export function formatarTempoDecorrido(dataIso: string): string {
  const minutos = Math.floor((Date.now() - new Date(dataIso).getTime()) / (1000 * 60));
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} dia(s)`;
}
