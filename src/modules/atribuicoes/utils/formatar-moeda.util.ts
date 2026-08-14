// Formatação numérica da lista de Executivos — duplicada de propósito em
// vez de importar de dashboard-vendas (módulos não compartilham utilitário
// de domínio entre si, ver princípio de isolamento). Mesma regra de
// abreviação (M) usada lá, formato "R$ X,X M" (SPEC seção 0).

export function formatarMoedaAbreviada(valor: number): string {
  const abs = Math.abs(valor);
  const sinal = valor < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (abs >= 1_000) return `${sinal}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")} mil`;
  return `${sinal}R$ ${abs.toFixed(2).replace(".", ",")}`;
}

export function formatarPercentual(valorPct: number, casasDecimais = 1): string {
  return `${valorPct.toFixed(casasDecimais).replace(".", ",")}%`;
}
