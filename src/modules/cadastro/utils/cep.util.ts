export function unmaskCep(valorDigitado: string): string {
  return valorDigitado.replace(/\D/g, "").slice(0, 8);
}

export function maskCep(valorDigitado: string): string {
  const limpo = unmaskCep(valorDigitado);
  if (limpo.length <= 5) return limpo;
  return `${limpo.slice(0, 5)}-${limpo.slice(5, 8)}`;
}
