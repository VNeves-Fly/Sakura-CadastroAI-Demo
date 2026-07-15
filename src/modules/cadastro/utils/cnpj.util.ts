// Validação do dígito verificador conforme a especificação de CNPJ
// alfanumérico da Receita Federal (12 caracteres-base + 2 dígitos
// verificadores numéricos). Cada caractere-base vale charCode - 48
// ('0'-'9' -> 0-9, 'A'-'Z' -> 17-42); os dígitos verificadores em si são
// sempre numéricos.
const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function valorCaractere(char: string): number {
  return char.charCodeAt(0) - 48;
}

function calcularDigito(base: string, pesos: number[]): number {
  const soma = base.split("").reduce((total, char, index) => {
    const peso = pesos[index] ?? 0;
    return total + valorCaractere(char) * peso;
  }, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function unmaskCnpj(valorMascarado: string): string {
  return valorMascarado
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);
}

export function maskCnpj(valorDigitado: string): string {
  const limpo = unmaskCnpj(valorDigitado);
  const partes = [
    limpo.slice(0, 2),
    limpo.slice(2, 5),
    limpo.slice(5, 8),
    limpo.slice(8, 12),
    limpo.slice(12, 14),
  ];

  let resultado = partes[0] ?? "";
  if (partes[1]) resultado += `.${partes[1]}`;
  if (partes[2]) resultado += `.${partes[2]}`;
  if (partes[3]) resultado += `/${partes[3]}`;
  if (partes[4]) resultado += `-${partes[4]}`;

  return resultado;
}

export function validarDigitoVerificador(cnpjSemMascara: string): boolean {
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpjSemMascara)) {
    return false;
  }

  const base = cnpjSemMascara.slice(0, 12);
  const dv1Esperado = Number(cnpjSemMascara[12]);
  const dv2Esperado = Number(cnpjSemMascara[13]);

  const dv1 = calcularDigito(base, PESOS_DV1);
  const dv2 = calcularDigito(base + dv1, PESOS_DV2);

  return dv1 === dv1Esperado && dv2 === dv2Esperado;
}

export interface CnpjValidationResult {
  valido: boolean;
  mensagem: string | null;
}

export function validarCnpjComMensagem(valorMascarado: string): CnpjValidationResult {
  const limpo = unmaskCnpj(valorMascarado);

  if (limpo.length === 0) {
    return { valido: false, mensagem: null };
  }

  if (limpo.length < 14) {
    return { valido: false, mensagem: "CNPJ incompleto. São necessários 14 caracteres." };
  }

  if (!validarDigitoVerificador(limpo)) {
    return { valido: false, mensagem: "CNPJ inválido. Verifique os caracteres digitados." };
  }

  return { valido: true, mensagem: null };
}

export function isCnpjAlfanumerico(cnpjSemMascara: string): boolean {
  return /[A-Z]/.test(cnpjSemMascara.slice(0, 12));
}
