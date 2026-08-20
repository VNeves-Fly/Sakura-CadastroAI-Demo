// Formatação isolada deste módulo (cada módulo tem a própria, ver
// dashboard-vendas/utils e agencias-crm/utils — mesmo padrão do projeto).

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

// "R$ 26,5 M" / "R$ 746,6 mil" — abreviação usada nos KPIs e nas listas
// de mix de pagamento/crédito (SPEC seções 5-7), onde o valor exato não
// cabe/não é o foco.
export function formatarMoedaAbreviada(valor: number): string {
  const abs = Math.abs(valor);
  if (abs >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (abs >= 1_000) return `R$ ${(valor / 1_000).toFixed(1).replace(".", ",")} mil`;
  return formatarMoeda(valor);
}

export function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

export function formatarPercentual(valor: number): string {
  return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function formatarData(data: Date | null): string {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(data);
}

export function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);
}

export function formatarDistanciaEmDias(data: Date, agora: Date): string {
  const dias = Math.round((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "hoje";
  if (dias === 1) return "há 1 dia";
  return `há ${dias} dias`;
}
