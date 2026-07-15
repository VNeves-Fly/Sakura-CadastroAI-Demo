export function normalizarNome(nome: string): string {
  return nome.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
}
