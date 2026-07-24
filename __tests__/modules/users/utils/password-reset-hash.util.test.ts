import { hashPasswordResetValue } from "@/modules/users/utils/password-reset-hash.util";

describe("hashPasswordResetValue", () => {
  it("é determinístico: o mesmo valor sempre gera o mesmo hash", () => {
    expect(hashPasswordResetValue("123456")).toBe(hashPasswordResetValue("123456"));
  });

  it("gera hashes diferentes pra valores diferentes", () => {
    expect(hashPasswordResetValue("123456")).not.toBe(hashPasswordResetValue("654321"));
  });

  it("devolve um hex de 64 caracteres (sha256)", () => {
    expect(hashPasswordResetValue("abc")).toMatch(/^[0-9a-f]{64}$/);
  });
});
