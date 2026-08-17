// Formatação numérica do detalhe de Gestor — duplicada de propósito em vez
// de importar de atribuicoes/dashboard-vendas (módulos não compartilham
// utilitário de domínio entre si, ver princípio de isolamento). Mesma regra
// de abreviação (M) usada nos outros módulos.

export function formatarMoedaCompleta(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export function formatarMoedaAbreviada(valor: number): string {
  const abs = Math.abs(valor);
  const sinal = valor < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sinal}R$ ${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} B`;
  if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (abs >= 1_000) return `${sinal}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")} mil`;
  return `${sinal}R$ ${abs.toFixed(2).replace(".", ",")}`;
}

export function formatarPercentual(valorPct: number, casasDecimais = 1): string {
  return `${valorPct.toFixed(casasDecimais).replace(".", ",")}%`;
}
