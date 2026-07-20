import { usersAdapter } from "@/modules/users/adapters/users.adapter";
import type { RawUserResponse } from "@/modules/users/services/users.service";

describe("usersAdapter.toServiceInput", () => {
  it("normaliza e-mail (trim + minúsculo), nome, sobrenome e telefone (trim)", () => {
    expect(
      usersAdapter.toServiceInput({
        firstName: "  Fulano  ",
        lastName: "  de Tal  ",
        email: "  Fulano@Empresa.COM  ",
        phone: "  11912345678  ",
        cargo: "ANALISTA",
        password: "senha-forte-123",
        mustChangePassword: false,
        useTemporaryPassword: false,
      }),
    ).toEqual({
      firstName: "Fulano",
      lastName: "de Tal",
      email: "fulano@empresa.com",
      phone: "11912345678",
      cargo: "ANALISTA",
      password: "senha-forte-123",
      mustChangePassword: false,
      useTemporaryPassword: false,
    });
  });

  it("não mexe na senha (case-sensitive por natureza)", () => {
    const resultado = usersAdapter.toServiceInput({
      firstName: "Fulano",
      lastName: "Tal",
      email: "fulano@empresa.com",
      phone: "11912345678",
      cargo: "ANALISTA",
      password: "SenhaComMaiuscula123",
      mustChangePassword: false,
      useTemporaryPassword: false,
    });
    expect(resultado.password).toBe("SenhaComMaiuscula123");
  });
});

describe("usersAdapter.toView / toViewList", () => {
  const raw: RawUserResponse = {
    id: "1",
    firstName: "Fulano",
    lastName: "Tal",
    email: "fulano@empresa.com",
    phone: "11912345678",
    cargo: "ANALISTA",
    mustChangePassword: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  it("toView expõe só os campos que a view precisa (sem updatedAt)", () => {
    expect(usersAdapter.toView(raw)).toEqual({
      id: "1",
      firstName: "Fulano",
      lastName: "Tal",
      email: "fulano@empresa.com",
      phone: "11912345678",
      cargo: "ANALISTA",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("toViewList mapeia a lista inteira usando a mesma regra do toView", () => {
    expect(usersAdapter.toViewList([raw, { ...raw, id: "2" }])).toEqual([
      usersAdapter.toView(raw),
      usersAdapter.toView({ ...raw, id: "2" }),
    ]);
  });
});

describe("usersAdapter.toCreatedResult", () => {
  const raw: RawUserResponse = {
    id: "1",
    firstName: "Fulano",
    lastName: "Tal",
    email: "fulano@empresa.com",
    phone: "11912345678",
    cargo: "ANALISTA",
    mustChangePassword: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    temporaryPassword: "aB3!xy9Qz2*k",
  };

  it("expõe a senha temporária junto com a view do usuário", () => {
    expect(usersAdapter.toCreatedResult(raw)).toEqual({
      user: usersAdapter.toView(raw),
      temporaryPassword: "aB3!xy9Qz2*k",
    });
  });
});
