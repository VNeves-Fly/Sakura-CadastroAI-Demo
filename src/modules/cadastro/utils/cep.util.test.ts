import { maskCep, unmaskCep } from "@/modules/cadastro/utils/cep.util";

describe("unmaskCep", () => {
  it("remove tudo que não for dígito", () => {
    expect(unmaskCep("01310-100")).toBe("01310100");
  });

  it("trunca em 8 dígitos", () => {
    expect(unmaskCep("013101009999")).toBe("01310100");
  });
});

describe("maskCep", () => {
  it("formata progressivamente", () => {
    expect(maskCep("01310")).toBe("01310");
    expect(maskCep("01310100")).toBe("01310-100");
  });
});
