import { ESTADO_CIVIL_VALORES, type EstadoCivil } from "@/modules/cadastro/domain/enums";

// Padrões de busca (já sem acento, minúsculo) — cobrem variações de gênero
// e sufixo "(a)" que a IA às vezes devolve ("Casada", "casado(a)", "viúva",
// "solteira") em vez do valor canônico. Mesmo espírito de normalização do
// MaritalStatus no agente de análise de documentos.
const PADROES: Array<{ valor: EstadoCivil; regex: RegExp }> = [
  { valor: "uniao_estavel", regex: /uniao.*estavel/ },
  { valor: "solteiro", regex: /^solt/ },
  { valor: "casado", regex: /^casad/ },
  { valor: "separado", regex: /^separad/ },
  { valor: "divorciado", regex: /^divorci/ },
  { valor: "viuvo", regex: /^viuv/ },
  { valor: "desquitado", regex: /^desquit/ },
];

function removerAcentos(valor: string): string {
  return valor.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Normaliza o `estado_civil` extraído pela IA pro enum canônico — nunca
// lança erro; devolve null quando o valor não é reconhecido (em vez de
// deixar passar texto livre tipo "Casado(a)" pro formulário).
export function normalizarEstadoCivil(valor: unknown): EstadoCivil | null {
  if (typeof valor !== "string" || valor.trim().length === 0) return null;

  const normalizado = removerAcentos(valor.trim().toLowerCase());

  if ((ESTADO_CIVIL_VALORES as readonly string[]).includes(normalizado)) {
    return normalizado as EstadoCivil;
  }

  return PADROES.find((padrao) => padrao.regex.test(normalizado))?.valor ?? null;
}
