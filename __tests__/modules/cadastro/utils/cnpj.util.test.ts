import {
  isCnpjAlfanumerico,
  maskCnpj,
  unmaskCnpj,
  validarCnpjComMensagem,
  validarDigitoVerificador,
} from "@/modules/cadastro/utils/cnpj.util";

// CNPJs com dígito verificador válido de verdade (conferidos contra o
// algoritmo oficial da Receita, não inventados).
const CNPJ_VALIDO = "11222333000181";
const CNPJ_VALIDO_2 = "11988877000159";

describe("unmaskCnpj", () => {
  it("remove tudo que não for alfanumérico e converte pra maiúsculo", () => {
    expect(unmaskCnpj("11.222.333/0001-81")).toBe("11222333000181");
    expect(unmaskCnpj("ab.cde.123/0001-81")).toBe("ABCDE123000181");
  });

  it("trunca em 14 caracteres", () => {
    expect(unmaskCnpj("112223330001819999")).toBe("11222333000181");
  });
});

describe("maskCnpj", () => {
  it("aplica a máscara progressivamente conforme os dígitos chegam", () => {
    expect(maskCnpj("11")).toBe("11");
    expect(maskCnpj("11222")).toBe("11.222");
    expect(maskCnpj("11222333")).toBe("11.222.333");
    expect(maskCnpj("112223330001")).toBe("11.222.333/0001");
    expect(maskCnpj(CNPJ_VALIDO)).toBe("11.222.333/0001-81");
  });
});

describe("validarDigitoVerificador", () => {
  it("aprova CNPJs numéricos com dígito verificador correto", () => {
    expect(validarDigitoVerificador(CNPJ_VALIDO)).toBe(true);
    expect(validarDigitoVerificador(CNPJ_VALIDO_2)).toBe(true);
  });

  it("reprova quando o dígito verificador não confere", () => {
    const comDigitoErrado = CNPJ_VALIDO.slice(0, 13) + "0";
    expect(validarDigitoVerificador(comDigitoErrado)).toBe(false);
  });

  it("reprova formato fora do padrão (tamanho errado ou base em minúsculo)", () => {
    expect(validarDigitoVerificador("112223330001")).toBe(false); // faltam os 2 DVs
    expect(validarDigitoVerificador("11222333000181000")).toBe(false); // longo demais
    expect(validarDigitoVerificador("abcde123000181")).toBe(false); // base minúscula: regex exige [A-Z0-9]
  });

  it("com máscara (não unmasked) sempre reprova — a função espera a string já limpa", () => {
    expect(validarDigitoVerificador("11.222.333/0001-81")).toBe(false);
  });
});

describe("validarCnpjComMensagem", () => {
  it("string vazia: inválido, sem mensagem (estado inicial, não um erro)", () => {
    expect(validarCnpjComMensagem("")).toEqual({ valido: false, mensagem: null });
  });

  it("incompleto: inválido com mensagem específica", () => {
    const resultado = validarCnpjComMensagem("11.222.333");
    expect(resultado.valido).toBe(false);
    expect(resultado.mensagem).toMatch(/incompleto/i);
  });

  it("completo mas com dígito verificador errado: inválido com mensagem de CNPJ inválido", () => {
    const resultado = validarCnpjComMensagem("11.222.333/0001-80");
    expect(resultado.valido).toBe(false);
    expect(resultado.mensagem).toMatch(/inválido/i);
  });

  it("válido: sem mensagem de erro", () => {
    expect(validarCnpjComMensagem("11.222.333/0001-81")).toEqual({
      valido: true,
      mensagem: null,
    });
  });
});

describe("isCnpjAlfanumerico", () => {
  it("identifica letra nos primeiros 12 caracteres (a base) como alfanumérico", () => {
    expect(isCnpjAlfanumerico("ABCDE123000181")).toBe(true);
  });

  it("não considera alfanumérico um CNPJ 100% numérico", () => {
    expect(isCnpjAlfanumerico(CNPJ_VALIDO)).toBe(false);
  });

  it("ignora letras que apareçam só nos dígitos verificadores (não deveria acontecer, mas não é a base)", () => {
    expect(isCnpjAlfanumerico("112223330001AB")).toBe(false);
  });
});
