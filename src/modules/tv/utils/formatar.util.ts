// Formatação numérica isolada deste módulo — módulos não compartilham
// utilitário de formatação entre si (mesmo princípio de
// dashboard-vendas/utils/formatar-moeda.util.ts).

export function formatarMoedaBrl(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export function formatarPercentual(valorPct: number, casasDecimais = 1): string {
  return `${valorPct.toFixed(casasDecimais).replace(".", ",")}%`;
}

export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

// Só pro "Ticket médio" dos cards Aéreo/Terrestre — precisa ser curto
// pra caber ao lado de "Bilhetes"/"Agências" no mesmo card sem truncar
// (ex.: "R$ 2,2 mil", igual ao print de referência).
export function formatarMoedaAbreviada(valor: number): string {
  const abs = Math.abs(valor);
  const sinal = valor < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sinal}R$ ${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} B`;
  if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (abs >= 1_000) return `${sinal}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")} mil`;
  return formatarMoedaBrl(valor);
}

// Separa a parte decimal do valor em R$ pra render em destaque menor —
// "R$ 1.512.307" grande + ",36" pequeno sobrescrito (pedido do spec da
// página /tv, seção 4: só os valores grandes de Vendas/Aéreo/Terrestre
// usam esse split; Top10 e badges usam o valor inteiro formatado normal).
export function formatarMoedaComDecimalPequeno(valor: number): {
  principal: string;
  decimal: string;
} {
  const formatado = formatarMoedaBrl(valor);
  const indiceVirgula = formatado.lastIndexOf(",");
  if (indiceVirgula === -1) return { principal: formatado, decimal: "" };
  return {
    principal: formatado.slice(0, indiceVirgula),
    decimal: formatado.slice(indiceVirgula),
  };
}
