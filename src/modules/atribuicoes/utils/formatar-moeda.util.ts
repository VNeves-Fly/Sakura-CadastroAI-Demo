// Formatação numérica da lista de Executivos — duplicada de propósito em
// vez de importar de dashboard-vendas (módulos não compartilham utilitário
// de domínio entre si, ver princípio de isolamento). Mesma regra de
// abreviação (M) usada lá, formato "R$ X,X M" (SPEC seção 0).

// Formato "cheio" (SPEC seção 0: "R$ 22.173.786,71 quando valor cheio") —
// usado no hero de vendas do mês, que é o único número que a spec pede
// sem abreviação.
export function formatarMoedaCompleta(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

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
