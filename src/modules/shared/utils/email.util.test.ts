import { validarEmail } from "@/modules/shared/utils/email.util";

describe("validarEmail", () => {
  it.each(["usuario@exemplo.com", "nome.sobrenome@empresa.com.br", "com+tag@dominio.io", "a@b.co"])(
    "aceita %s como válido",
    (email) => {
      expect(validarEmail(email)).toBe(true);
    },
  );

  it.each([
    "",
    "sem-arroba.com",
    "@sem-usuario.com",
    "usuario@",
    "usuario@dominio",
    "usuario@@dominio.com",
    "usuario com espaco@dominio.com",
  ])("rejeita %s como inválido", (email) => {
    expect(validarEmail(email)).toBe(false);
  });

  it("ignora espaços nas pontas antes de validar", () => {
    expect(validarEmail("  usuario@exemplo.com  ")).toBe(true);
  });
});
