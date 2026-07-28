import { sanitizarUnicodeParaJsonb } from "@/modules/shared/utils/sanitizar-unicode-jsonb.util";

const NUL = String.fromCharCode(0);
const SURROGATE_ALTO_SOLTO = String.fromCharCode(0xd800);
const SURROGATE_BAIXO_SOLTO = String.fromCharCode(0xdfff);
const PAR_SURROGATE_VALIDO = String.fromCharCode(0xd83d, 0xde00); // 😀

describe("sanitizarUnicodeParaJsonb", () => {
  it("remove o caractere NUL de dentro de uma string", () => {
    expect(sanitizarUnicodeParaJsonb(`antes${NUL}depois`)).toBe("antesdepois");
  });

  it("remove surrogates altos e baixos sem par correspondente", () => {
    expect(sanitizarUnicodeParaJsonb(`nome${SURROGATE_ALTO_SOLTO}sobrenome`)).toBe("nomesobrenome");
    expect(sanitizarUnicodeParaJsonb(`nome${SURROGATE_BAIXO_SOLTO}sobrenome`)).toBe(
      "nomesobrenome",
    );
  });

  it("preserva pares surrogate válidos (ex.: emoji)", () => {
    expect(sanitizarUnicodeParaJsonb(`ok${PAR_SURROGATE_VALIDO}fim`)).toBe(
      `ok${PAR_SURROGATE_VALIDO}fim`,
    );
  });

  it("preserva texto sem nenhum caractere inválido", () => {
    expect(sanitizarUnicodeParaJsonb("Agência de viagens Ltda")).toBe("Agência de viagens Ltda");
  });

  it("sanitiza recursivamente objetos e arrays aninhados", () => {
    const entrada = {
      amat: [
        {
          tool: "search_amat_debts",
          output: { credor: `Banco${NUL} X`, motivo: null, total: 1200 },
        },
      ],
      sofia: [`status${SURROGATE_ALTO_SOLTO}CONSTA`],
    };

    expect(sanitizarUnicodeParaJsonb(entrada)).toEqual({
      amat: [
        {
          tool: "search_amat_debts",
          output: { credor: "Banco X", motivo: null, total: 1200 },
        },
      ],
      sofia: ["statusCONSTA"],
    });
  });

  it("preserva valores não-string (número, booleano, null, undefined) intactos", () => {
    expect(sanitizarUnicodeParaJsonb(1200)).toBe(1200);
    expect(sanitizarUnicodeParaJsonb(true)).toBe(true);
    expect(sanitizarUnicodeParaJsonb(null)).toBeNull();
    expect(sanitizarUnicodeParaJsonb(undefined)).toBeUndefined();
  });
});
