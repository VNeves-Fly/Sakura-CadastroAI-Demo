// Formatação isolada deste módulo (cada módulo tem a própria, ver
// dashboard-vendas/utils e agencias-crm/utils — mesmo padrão do projeto).

export function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

export function formatarMoedaBrl(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

// ≥ 1 milhão abrevia pra "R$ X,X M" (1 casa decimal) — usado só no
// resumo "Volume gerado" do card, não na coluna "Volume total" da tabela
// (essa continua no formato cheio, formatarMoedaBrl).
export function formatarMoedaAbreviada(valor: number): string {
  const abs = Math.abs(valor);
  const sinal = valor < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")} M`;
  return formatarMoedaBrl(valor);
}

export function formatarPercentualDaBase(valor: number, total: number): string {
  if (total === 0) return "0% da base";
  return `${((valor / total) * 100).toFixed(1).replace(".", ",")}% da base`;
}

export function formatarDataBr(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

// Datas do SST vêm como string ISO ("YYYY-MM-DD" ou timestamp completo).
export function formatarDataIsoBr(dataIso: string): string {
  return formatarDataBr(new Date(dataIso));
}
