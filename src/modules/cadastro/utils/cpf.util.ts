function calcularDigito(base: string, pesoInicial: number): number {
  const soma = base
    .split("")
    .reduce((total, char, index) => total + Number(char) * (pesoInicial - index), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function unmaskCpf(valorMascarado: string): string {
  return valorMascarado.replace(/\D/g, "").slice(0, 11);
}

export function maskCpf(valorDigitado: string): string {
  const limpo = unmaskCpf(valorDigitado);
  const partes = [limpo.slice(0, 3), limpo.slice(3, 6), limpo.slice(6, 9), limpo.slice(9, 11)];

  let resultado = partes[0] ?? "";
  if (partes[1]) resultado += `.${partes[1]}`;
  if (partes[2]) resultado += `.${partes[2]}`;
  if (partes[3]) resultado += `-${partes[3]}`;

  return resultado;
}

export function validarDigitoVerificadorCpf(cpfSemMascara: string): boolean {
  if (!/^\d{11}$/.test(cpfSemMascara)) return false;
  if (/^(\d)\1{10}$/.test(cpfSemMascara)) return false;

  const base9 = cpfSemMascara.slice(0, 9);
  const dv1 = calcularDigito(base9, 10);
  const dv2 = calcularDigito(base9 + dv1, 11);

  return dv1 === Number(cpfSemMascara[9]) && dv2 === Number(cpfSemMascara[10]);
}

export function validarCpfComMensagem(valorMascarado: string): {
  valido: boolean;
  mensagem: string | null;
} {
  const limpo = unmaskCpf(valorMascarado);

  if (limpo.length === 0) {
    return { valido: false, mensagem: null };
  }

  if (limpo.length < 11) {
    return { valido: false, mensagem: "CPF incompleto. São necessários 11 dígitos." };
  }

  if (!validarDigitoVerificadorCpf(limpo)) {
    return { valido: false, mensagem: "CPF inválido. Verifique os números digitados." };
  }

  return { valido: true, mensagem: null };
}
