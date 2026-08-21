// Formatação numérica da listagem de Agências — duplicada de propósito
// (módulos não compartilham utilitário de domínio entre si, mesmo
// princípio de isolamento já documentado em outros módulos deste
// projeto).

// Formato "cheio" (SPEC_AGENCIAS_SAKURA seção 3.5.A: "número exato... NUNCA
// abreviar") — usado só no valor total da aba Dashboard do detalhe.
export function formatarMoedaCompleta(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export function formatarMoedaAbreviada(valor: number): string {
  const abs = Math.abs(valor);
  const sinal = valor < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sinal}R$ ${(abs / 1_000).toFixed(0)}k`;
  return `${sinal}R$ ${abs.toFixed(2).replace(".", ",")}`;
}

export function formatarPercentual(valor: number, casasDecimais = 1): string {
  return `${valor.toFixed(casasDecimais).replace(".", ",")}%`;
}

export function formatarData(dataIso: string): string {
  const data = new Date(dataIso);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}
