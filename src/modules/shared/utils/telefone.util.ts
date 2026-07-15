export interface PaisTelefone {
  codigo: string;
  nome: string;
  ddi: string;
  bandeira: string;
  placeholder: string;
  digitosEsperados: number | null;
  formatar: (digitos: string) => string;
}

function formatarBrasil(digitos: string): string {
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  if (numero.length <= 5) return `(${ddd}) ${numero}`;
  return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5, 9)}`;
}

function formatarEstadosUnidos(digitos: string): string {
  if (digitos.length === 0) return "";
  if (digitos.length <= 3) return `(${digitos}`;
  const area = digitos.slice(0, 3);
  const resto = digitos.slice(3);
  if (resto.length <= 3) return `(${area}) ${resto}`;
  return `(${area}) ${resto.slice(0, 3)}-${resto.slice(3, 7)}`;
}

function formatarPortugal(digitos: string): string {
  return [digitos.slice(0, 3), digitos.slice(3, 6), digitos.slice(6, 9)].filter(Boolean).join(" ");
}

function formatarArgentina(digitos: string): string {
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  const area = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  if (resto.length <= 4) return `(${area}) ${resto}`;
  return `(${area}) ${resto.slice(0, 4)}-${resto.slice(4, 8)}`;
}

function formatarLivre(digitos: string): string {
  return digitos;
}

const BRASIL: PaisTelefone = {
  codigo: "BR",
  nome: "Brasil",
  ddi: "+55",
  bandeira: "🇧🇷",
  placeholder: "(11) 99999-9999",
  digitosEsperados: 11,
  formatar: formatarBrasil,
};

const ESTADOS_UNIDOS: PaisTelefone = {
  codigo: "US",
  nome: "Estados Unidos",
  ddi: "+1",
  bandeira: "🇺🇸",
  placeholder: "(212) 555-0100",
  digitosEsperados: 10,
  formatar: formatarEstadosUnidos,
};

const PORTUGAL: PaisTelefone = {
  codigo: "PT",
  nome: "Portugal",
  ddi: "+351",
  bandeira: "🇵🇹",
  placeholder: "912 345 678",
  digitosEsperados: 9,
  formatar: formatarPortugal,
};

const ARGENTINA: PaisTelefone = {
  codigo: "AR",
  nome: "Argentina",
  ddi: "+54",
  bandeira: "🇦🇷",
  placeholder: "(11) 2345-6789",
  digitosEsperados: 10,
  formatar: formatarArgentina,
};

const OUTRO_PAIS: PaisTelefone = {
  codigo: "OUTRO",
  nome: "Outro país",
  ddi: "",
  bandeira: "🌐",
  placeholder: "DDI + número",
  digitosEsperados: null,
  formatar: formatarLivre,
};

export const PAISES_TELEFONE: PaisTelefone[] = [
  BRASIL,
  ESTADOS_UNIDOS,
  PORTUGAL,
  ARGENTINA,
  OUTRO_PAIS,
];

export function paisTelefonePorCodigo(codigo: string): PaisTelefone {
  return PAISES_TELEFONE.find((pais) => pais.codigo === codigo) ?? BRASIL;
}

// Remove tudo que não for dígito — garante que letras nunca fiquem no
// valor, mesmo que o usuário cole texto com caracteres inválidos.
export function unmaskTelefone(valorDigitado: string): string {
  return valorDigitado.replace(/\D/g, "");
}

export function maskTelefone(valorDigitado: string, codigoPais: string): string {
  const pais = paisTelefonePorCodigo(codigoPais);
  const limpo = unmaskTelefone(valorDigitado).slice(0, pais.digitosEsperados ?? 15);
  return pais.formatar(limpo);
}

export function validarTelefone(valorMascarado: string, codigoPais: string): boolean {
  const pais = paisTelefonePorCodigo(codigoPais);
  const digitos = unmaskTelefone(valorMascarado);

  if (pais.digitosEsperados === null) {
    return digitos.length >= 6;
  }

  return digitos.length === pais.digitosEsperados;
}
