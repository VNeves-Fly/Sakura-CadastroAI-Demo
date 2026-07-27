import {
  maskTelefone,
  paisTelefonePorCodigo,
  telefonesEquivalentes,
  unmaskTelefone,
  validarTelefone,
} from "@/modules/shared/utils/telefone.util";

describe("paisTelefonePorCodigo", () => {
  it("resolve cada país suportado pelo código", () => {
    expect(paisTelefonePorCodigo("BR").nome).toBe("Brasil");
    expect(paisTelefonePorCodigo("US").nome).toBe("Estados Unidos");
    expect(paisTelefonePorCodigo("PT").nome).toBe("Portugal");
    expect(paisTelefonePorCodigo("AR").nome).toBe("Argentina");
    expect(paisTelefonePorCodigo("OUTRO").nome).toBe("Outro país");
  });

  it("cai pro Brasil como padrão quando o código não existe", () => {
    expect(paisTelefonePorCodigo("XX").codigo).toBe("BR");
  });
});

describe("unmaskTelefone", () => {
  it("remove tudo que não for dígito", () => {
    expect(unmaskTelefone("(11) 99999-9999")).toBe("11999999999");
  });
});

describe("maskTelefone", () => {
  it("formata progressivamente pro Brasil (DDD + 9 dígitos)", () => {
    expect(maskTelefone("11", "BR")).toBe("(11");
    expect(maskTelefone("1199999", "BR")).toBe("(11) 99999");
    expect(maskTelefone("11999999999", "BR")).toBe("(11) 99999-9999");
  });

  it("formata pros Estados Unidos (área + 7 dígitos)", () => {
    expect(maskTelefone("2125550100", "US")).toBe("(212) 555-0100");
  });

  it("formata pra Portugal (9 dígitos, sem DDD)", () => {
    expect(maskTelefone("912345678", "PT")).toBe("912 345 678");
  });

  it("trunca no total de dígitos esperado do país", () => {
    expect(maskTelefone("119999999999999", "BR")).toBe("(11) 99999-9999");
  });

  it("'Outro país' não aplica máscara nem trunca (livre)", () => {
    expect(maskTelefone("+493012345678", "OUTRO")).toBe("493012345678");
  });
});

describe("validarTelefone", () => {
  it("exige a quantidade exata de dígitos do país", () => {
    expect(validarTelefone("(11) 99999-9999", "BR")).toBe(true);
    expect(validarTelefone("(11) 9999-9999", "BR")).toBe(false); // 10 digitos, BR exige 11
  });

  it("país 'Outro' aceita qualquer coisa com 6+ dígitos", () => {
    expect(validarTelefone("123456", "OUTRO")).toBe(true);
    expect(validarTelefone("12345", "OUTRO")).toBe(false);
  });
});

describe("telefonesEquivalentes", () => {
  it("bate o mesmo número em formatos diferentes (mascarado x wa_id cru)", () => {
    expect(telefonesEquivalentes("(11) 98765-4321", "5511987654321")).toBe(true);
  });

  it("tolera o 9º dígito do celular ausente de um dos lados", () => {
    expect(telefonesEquivalentes("(11) 98765-4321", "551187654321")).toBe(true);
    expect(telefonesEquivalentes("11987654321", "1187654321")).toBe(true);
  });

  it("não bate números realmente diferentes", () => {
    expect(telefonesEquivalentes("(11) 98765-4321", "(21) 98765-4321")).toBe(false);
  });

  it("ignora o DDI 55 de qualquer um dos lados", () => {
    expect(telefonesEquivalentes("+55 11 98765-4321", "11987654321")).toBe(true);
  });
});
