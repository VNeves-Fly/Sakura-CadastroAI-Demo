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

// Mapa código → rótulo (bandeira + DDI), pro `items` do Select — sem ele,
// `<Select.Value>` mostra o código bruto ("BR") em vez do rótulo
// formatado (ver base-ui Select.Root `items`).
export const PAISES_TELEFONE_ITEMS: Record<string, string> = Object.fromEntries(
  PAISES_TELEFONE.map((pais) => [pais.codigo, `${pais.bandeira} ${pais.ddi || "Outro"}`]),
);

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

// Variante do formatador BR que aceita tanto fixo (DDD + 8 dígitos) quanto
// celular (DDD + 9 dígitos) — usada só pelo telefone comercial da empresa,
// que ao contrário do telefone do sócio (usado pro link de assinatura via
// WhatsApp) não precisa necessariamente ser um número com WhatsApp. Mesmo
// motivo de format-telefone.ts (chat) ficar isolado do resto deste util.
function formatarBrasilFixoOuCelular(digitos: string): string {
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const quebra = numero.length <= 8 ? 4 : 5;
  if (numero.length <= quebra) return `(${ddd}) ${numero}`;
  return `(${ddd}) ${numero.slice(0, quebra)}-${numero.slice(quebra, quebra + 4)}`;
}

export function maskTelefoneComercial(valorDigitado: string, codigoPais: string): string {
  if (codigoPais === "BR") {
    return formatarBrasilFixoOuCelular(unmaskTelefone(valorDigitado).slice(0, 11));
  }
  return maskTelefone(valorDigitado, codigoPais);
}

export function validarTelefoneComercial(valorMascarado: string, codigoPais: string): boolean {
  if (codigoPais === "BR") {
    const digitos = unmaskTelefone(valorMascarado);
    return digitos.length === 10 || digitos.length === 11;
  }
  return validarTelefone(valorMascarado, codigoPais);
}

// Candidatos de variação do número local — cobre o 9º dígito do celular
// brasileiro, que a Meta às vezes inclui/omite de forma inconsistente
// dependendo da operadora/registro legado.
function variantesLocais(localDigits: string): string[] {
  if (localDigits.length === 11) {
    return [localDigits, localDigits.slice(0, 2) + localDigits.slice(3)];
  }
  if (localDigits.length === 10) {
    return [localDigits, `${localDigits.slice(0, 2)}9${localDigits.slice(2)}`];
  }
  return [localDigits];
}

function localSemDdi(digitos: string): string {
  return digitos.startsWith("55") ? digitos.slice(2) : digitos;
}

// Deduplica uma lista de opções de telefone por dígito (ignora
// formatação) — um mesmo número não aparece duas vezes mesmo vindo de
// fontes diferentes (ex.: Agencia.telefoneContato repetindo
// CadastroComplementar.telefoneComercial). Reaproveitado tanto por
// montarOpcoesAtendimento (dossiê) quanto por PrismaAgenciaContatoRepository
// (lista de Contatos do /atendimento) — mesma regra, um lugar só.
export function deduplicarOpcoesTelefone<T extends { telefone: string }>(opcoes: T[]): T[] {
  const vistos = new Set<string>();
  return opcoes.filter((opcao) => {
    const digitos = unmaskTelefone(opcao.telefone);
    if (digitos.length === 0 || vistos.has(digitos)) return false;
    vistos.add(digitos);
    return true;
  });
}

// Constrói o wa_id (E.164 sem "+") a partir de um telefone local salvo no
// cadastro (Agencia.telefoneContato, RepresentanteLegal.telefone etc, sem
// DDI armazenado) — usado só na criação de uma Conversa nova a partir da
// lista de Contatos (ver IniciarConversaUseCase), nunca em conversas que
// já vieram de mensagem inbound (essas já têm o wa_id real da Meta).
// Mesma suposição que telefonesEquivalentes já faz em todo o módulo
// atendimento (DDI 55 como default) — números de outro país cadastrados
// via "Outro país" no wizard não são cobertos por este heurístico.
export function paraWhatsappId(telefoneLocal: string): string {
  const digitos = unmaskTelefone(telefoneLocal);
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) {
    return digitos;
  }
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return digitos;
}

// Compara dois telefones em formatos livres (mascarado do formulário,
// wa_id cru da Meta etc.) tolerando a ambiguidade do 9º dígito — mesma
// lógica usada tanto por WhatsAppContactMatcherAdapter (casar mensagem
// recebida a um contato conhecido) quanto pelo dossiê (abrir a conversa
// certa de Atendimento a partir do telefone da agência/sócio).
export function telefonesEquivalentes(a: string, b: string): boolean {
  const variantesA = variantesLocais(localSemDdi(unmaskTelefone(a)));
  const variantesB = new Set(variantesLocais(localSemDdi(unmaskTelefone(b))));
  return variantesA.some((variante) => variantesB.has(variante));
}
