import {
  maskCpf,
  unmaskCpf,
  validarCpfComMensagem,
  validarDigitoVerificadorCpf,
} from "@/modules/cadastro/utils/cpf.util";

// CPF de teste com dígito verificador real (conferido contra o algoritmo
// oficial mod-11, não inventado) — é o CPF de teste mais usado em
// sistemas brasileiros justamente porque passa no cálculo de verdade.
const CPF_VALIDO = "11144477735";

describe("unmaskCpf", () => {
  it("remove tudo que não for dígito", () => {
    expect(unmaskCpf("111.444.777-35")).toBe(CPF_VALIDO);
  });

  it("trunca em 11 dígitos", () => {
    expect(unmaskCpf("111444777359999")).toBe(CPF_VALIDO);
  });
});

describe("maskCpf", () => {
  it("aplica a máscara progressivamente", () => {
    expect(maskCpf("111")).toBe("111");
    expect(maskCpf("111444")).toBe("111.444");
    expect(maskCpf("111444777")).toBe("111.444.777");
    expect(maskCpf(CPF_VALIDO)).toBe("111.444.777-35");
  });
});

describe("validarDigitoVerificadorCpf", () => {
  it("aprova CPF com dígito verificador correto", () => {
    expect(validarDigitoVerificadorCpf(CPF_VALIDO)).toBe(true);
  });

  it("reprova quando o dígito verificador não confere", () => {
    const comDigitoErrado = CPF_VALIDO.slice(0, 10) + "0";
    expect(validarDigitoVerificadorCpf(comDigitoErrado)).toBe(false);
  });

  it("reprova todos os dígitos iguais mesmo que por acaso passassem no cálculo", () => {
    expect(validarDigitoVerificadorCpf("11111111111")).toBe(false);
    expect(validarDigitoVerificadorCpf("00000000000")).toBe(false);
  });

  it("reprova formato fora do padrão (tamanho errado ou não numérico)", () => {
    expect(validarDigitoVerificadorCpf("1114447773")).toBe(false); // 10 dígitos
    expect(validarDigitoVerificadorCpf("111444777355")).toBe(false); // 12 dígitos
    expect(validarDigitoVerificadorCpf("1114447773A")).toBe(false);
  });
});

describe("validarCpfComMensagem", () => {
  it("string vazia: inválido, sem mensagem", () => {
    expect(validarCpfComMensagem("")).toEqual({ valido: false, mensagem: null });
  });

  it("incompleto: mensagem específica", () => {
    const resultado = validarCpfComMensagem("111.444");
    expect(resultado.valido).toBe(false);
    expect(resultado.mensagem).toMatch(/incompleto/i);
  });

  it("completo mas com dígito errado: mensagem de CPF inválido", () => {
    const resultado = validarCpfComMensagem("111.444.777-30");
    expect(resultado.valido).toBe(false);
    expect(resultado.mensagem).toMatch(/inválido/i);
  });

  it("válido: sem mensagem de erro", () => {
    expect(validarCpfComMensagem("111.444.777-35")).toEqual({ valido: true, mensagem: null });
  });
});
