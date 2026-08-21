// Formatação isolada deste módulo (cada módulo tem a própria, ver
// dashboard-vendas/utils e agencias-crm/utils — mesmo padrão do projeto).
// Só `formatarNumero` sobra depois da SPEC 2026-08-21: os demais valores
// da tela (moeda, datas, percentuais) já chegam formatados literalmente
// do mock-service, pra bater exatamente com o texto da SPEC.

export function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}
