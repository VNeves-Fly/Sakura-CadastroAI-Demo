// O util compartilhado (telefone.util.ts) assume sempre celular de 11
// dígitos — aqui o chat precisa diferenciar fixo (10 dígitos, sem regra
// de primeiro dígito) de celular (11 dígitos, terceiro dígito é sempre
// 9), então a máscara/validação ficam isoladas neste módulo.
export function unmaskTelefoneChat(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function maskTelefoneChat(valorDigitado: string, tipo: "fixo" | "celular"): string {
  const limite = tipo === "celular" ? 11 : 10;
  const digitos = unmaskTelefoneChat(valorDigitado).slice(0, limite);

  if (digitos.length <= 2) return digitos.length === 0 ? "" : `(${digitos}`;

  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  const quebra = tipo === "celular" ? 5 : 4;

  if (resto.length <= quebra) return `(${ddd}) ${resto}`;
  return `(${ddd}) ${resto.slice(0, quebra)}-${resto.slice(quebra)}`;
}

export function telefoneChatValido(valorDigitado: string, tipo: "fixo" | "celular"): boolean {
  const digitos = unmaskTelefoneChat(valorDigitado);
  if (tipo === "celular") return digitos.length === 11 && digitos[2] === "9";
  return digitos.length === 10;
}
