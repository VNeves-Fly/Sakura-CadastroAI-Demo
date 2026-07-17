import type { SignInResponse } from "next-auth/react";
import { loginAdapter } from "@/modules/auth/adapters/login.adapter";

describe("loginAdapter.toServiceInput", () => {
  it("normaliza o e-mail (trim + minúsculo) e preserva a senha intacta", () => {
    expect(
      loginAdapter.toServiceInput({ email: "  Fulano@Empresa.COM  ", password: "SenhaForte123" }),
    ).toEqual({ email: "fulano@empresa.com", password: "SenhaForte123" });
  });
});

describe("loginAdapter.fromServiceResult", () => {
  it("sucesso: sem erro", () => {
    const result: SignInResponse = { error: null, status: 200, ok: true, url: null };
    expect(loginAdapter.fromServiceResult(result)).toEqual({ success: true });
  });

  it("credenciais inválidas: mensagem amigável, não o erro cru do NextAuth", () => {
    const result: SignInResponse = {
      error: "CredentialsSignin",
      status: 401,
      ok: false,
      url: null,
    };
    expect(loginAdapter.fromServiceResult(result)).toEqual({
      success: false,
      error: "E-mail ou senha inválidos.",
    });
  });

  it("resultado undefined (falha inesperada de rede/NextAuth): mensagem genérica", () => {
    expect(loginAdapter.fromServiceResult(undefined)).toEqual({
      success: false,
      error: "Erro inesperado ao autenticar.",
    });
  });
});
