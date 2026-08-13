// Formatação numérica desta página — isolada da de `admin/utils` de
// propósito (módulos não compartilham utilitário de domínio diferente,
// ver princípio de isolamento entre módulos); a única regra que muda é a
// abreviação (M/B), que não existe em nenhum outro lugar do projeto.

export function formatarMoedaBrl(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

// Valores ≥ 1 milhão abreviam pra "R$ X,X M", ≥ 1 bilhão pra "R$ X,X B" —
// mantém 1 casa decimal fixa (padrão dos exemplos da spec: "R$ 8,1 M").
export function formatarMoedaAbreviada(valor: number): string {
  const abs = Math.abs(valor);
  const sinal = valor < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sinal}R$ ${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} B`;
  if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (abs >= 1_000) return `${sinal}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")} mil`;
  return formatarMoedaBrl(valor);
}

export function formatarPercentual(valorPct: number, casasDecimais = 1): string {
  return `${valorPct.toFixed(casasDecimais).replace(".", ",")}%`;
}

// Com sinal explícito (+/-) — usado nas variações de "Conversão" (ex:
// "+60,1%"), diferente do percentual "seco" de participação/margem.
export function formatarVariacaoPct(valorPct: number, casasDecimais = 1): string {
  const sinal = valorPct > 0 ? "+" : "";
  return `${sinal}${formatarPercentual(valorPct, casasDecimais)}`;
}

export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat("pt-BR").format(valor);
}
