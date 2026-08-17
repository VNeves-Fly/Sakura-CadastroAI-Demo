// "9 anos e 8 meses" / "0 anos e 11 meses" (SPEC seção 4.4) — cálculo real
// de calendário (anos e meses inteiros), não aproximação por dias/365.
export function tempoDecorrido(desde: Date, ate: Date = new Date()): string {
  let anos = ate.getFullYear() - desde.getFullYear();
  let meses = ate.getMonth() - desde.getMonth();
  if (ate.getDate() < desde.getDate()) meses -= 1;
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }
  if (anos < 0) return "0 anos e 0 meses";
  return `${anos} ano${anos === 1 ? "" : "s"} e ${meses} ${meses === 1 ? "mês" : "meses"}`;
}
