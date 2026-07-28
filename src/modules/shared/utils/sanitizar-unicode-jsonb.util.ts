// Postgres's json/jsonb parser rejeita o caractere NUL (ponto de código 0) e
// surrogates soltos (a metade de um par surrogate sem o par correspondente)
// com o erro 22P05 "unsupported Unicode escape sequence" — válidos pela spec
// JSON, mas impossíveis de guardar porque o tipo json/jsonb do Postgres é
// baseado em texto (que não representa o byte NUL). Payloads externos (ex.:
// raw_data do AMAT/SOFIA, vindos de fontes com encoding legado) ocasionalmente
// carregam esses caracteres, então qualquer valor com destino a uma coluna
// jsonb deve passar por aqui antes.
const CARACTERE_NUL = String.fromCharCode(0);
// eslint-disable-next-line no-control-regex
const NUL_OU_SURROGATE_SOLTO = new RegExp(
  `${CARACTERE_NUL}|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]`,
  "g",
);

export function sanitizarUnicodeParaJsonb<T>(valor: T): T {
  if (typeof valor === "string") {
    return valor.replace(NUL_OU_SURROGATE_SOLTO, "") as unknown as T;
  }
  if (Array.isArray(valor)) {
    return valor.map((item) => sanitizarUnicodeParaJsonb(item)) as unknown as T;
  }
  if (valor !== null && typeof valor === "object") {
    const resultado: Record<string, unknown> = {};
    for (const [chave, item] of Object.entries(valor)) {
      resultado[chave] = sanitizarUnicodeParaJsonb(item);
    }
    return resultado as T;
  }
  return valor;
}
