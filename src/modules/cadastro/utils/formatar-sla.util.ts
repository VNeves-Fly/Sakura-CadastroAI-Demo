// Média de tempo por etapa (ver SlaEtapaItem/calcularSlaPorEtapa) sempre
// chega em dias (float) — etapas rápidas (ex.: minutos) ficariam ilegíveis
// como "0.0 dias", então desce a unidade quando o valor fica pequeno
// demais pra fazer sentido na unidade de cima.
export function formatarSla(mediaDias: number): string {
  if (mediaDias >= 1) return `${mediaDias.toFixed(1)} dias`;

  const horas = mediaDias * 24;
  if (horas >= 1) return `${horas.toFixed(1)} horas`;

  const minutos = horas * 60;
  return minutos < 1 ? "menos de 1 min" : `${Math.round(minutos)} min`;
}
